"""
Climate AI Agent - Command-Line Interface
Single-file python implementation using LangChain, LangGraph, Gemini LLM, and Open-Meteo APIs.
"""

import os
import sys
import json
import datetime
import warnings
import requests
from typing import Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv()

# Suppress noisy deprecation warnings for clean terminal output
warnings.filterwarnings("ignore")

# Configure UTF-8 encoding for Windows standard output if available
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass
if hasattr(sys.stderr, "reconfigure"):
    try:
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from langchain_openai import ChatOpenAI
from langgraph.prebuilt import create_react_agent
from langchain_core.tools import tool
from langchain_core.messages import ToolMessage

# Check for OpenAI API key
OPENAI_API_KEY = os.environ.get("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    print("OPENAI_API_KEY is not set. Please configure your OpenAI API key before running the agent.")
    sys.exit(1)

# Global store for user location
USER_LOCATION: Dict[str, Any] = {
    "name": "Delhi",
    "latitude": 28.6139,
    "longitude": 77.2090
}

# System prompt enforcing strict anti-hallucination policies and same-language responses
SYSTEM_PROMPT = """You are a climate analysis agent.

Your highest priority is factual accuracy.

CRITICAL LANGUAGE RULE:
Automatically identify the language or blend of languages (e.g. English, Hindi, Hinglish, Spanish, French, German, etc.) used in the user's latest message. You MUST generate your entire response in that exact same language or style.
- If the user asks in English, respond in English.
- If the user asks in Hindi, respond in Hindi.
- If the user asks in Hinglish, respond naturally in Hinglish.
- If the user asks in any other language, respond in that language.
Maintain this same language consistently throughout your response. Do not switch languages halfway through.
Do not translate proper nouns, technical terms, place names, API fields, or numerical measurements unnecessarily.
Changing the response language MUST NOT change or compromise the underlying factual data, risk calculations, or tool accuracy.

NEVER fabricate, estimate, guess, or invent weather or climate measurements.

For weather-related questions, use the appropriate Open-Meteo tool before answering.

Use ONLY values returned by tools for factual meteorological claims.

Never create a temperature, rainfall amount, humidity value, wind speed, soil moisture value, historical weather value, or other measurement yourself.

If a tool says that data is unavailable, explicitly state that the data is unavailable.

Do not fill missing API values with guesses.

Risk scores are calculated deterministically by Python tools.
Do not change, invent, or override those scores.

Clearly distinguish:

1. Raw API data
2. Deterministic calculated risk indicators
3. AI interpretation
4. Limitations

Open-Meteo is the source of meteorological data available to this agent.

Historical weather information must also come from Open-Meteo's historical weather API.

Do not invent historical events or historical weather.

Do not claim that weather-based flood risk is a confirmed flood prediction.

Do not claim that weather-based water risk represents actual groundwater, reservoir, or drinking-water availability.

When data is unavailable, say so.

Your job is to reason over real tool results, not to manufacture data."""


def _fetch_open_meteo_forecast(lat: float, lon: float) -> Optional[Dict[str, Any]]:
    """Helper function to fetch forecast data from Open-Meteo Forecast API."""
    url = "https://api.open-meteo.com/v1/forecast"
    params = {
        "latitude": lat,
        "longitude": lon,
        "current": (
            "temperature_2m,relative_humidity_2m,apparent_temperature,"
            "precipitation,rain,showers,snowfall,cloud_cover,"
            "wind_speed_10m,wind_direction_10m"
        ),
        "hourly": (
            "temperature_2m,relative_humidity_2m,apparent_temperature,"
            "precipitation_probability,precipitation,soil_moisture_0_to_1cm,"
            "et0_fao_evapotranspiration,wet_bulb_temperature_2m,shortwave_radiation"
        ),
        "daily": (
            "temperature_2m_max,temperature_2m_min,apparent_temperature_max,"
            "apparent_temperature_min,precipitation_sum,"
            "precipitation_probability_max,wind_speed_10m_max"
        ),
        "forecast_days": 16,
        "timezone": "auto"
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception:
        return None


def _fetch_open_meteo_archive(lat: float, lon: float, start_date: str, end_date: str) -> Optional[Dict[str, Any]]:
    """Helper function to fetch historical data from Open-Meteo Historical Archive API."""
    url = "https://archive-api.open-meteo.com/v1/archive"
    params = {
        "latitude": lat,
        "longitude": lon,
        "start_date": start_date,
        "end_date": end_date,
        "daily": (
            "temperature_2m_max,temperature_2m_min,temperature_2m_mean,"
            "precipitation_sum,wind_speed_10m_max,apparent_temperature_max,"
            "apparent_temperature_min"
        ),
        "timezone": "auto"
    }
    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            return response.json()
        return None
    except Exception:
        return None


# =====================================================================
# REQUIRED TOOLS
# =====================================================================

@tool
def get_weather_forecast() -> str:
    """Retrieve real-time and forecast weather data from Open-Meteo for the user's location.
    Includes temperature, apparent temperature, humidity, precipitation, wind, soil moisture,
    evapotranspiration, wet-bulb temp, and solar radiation.
    """
    lat = USER_LOCATION["latitude"]
    lon = USER_LOCATION["longitude"]
    data = _fetch_open_meteo_forecast(lat, lon)
    if not data:
        return "Data unavailable from Open-Meteo."
    
    current = data.get("current", {})
    hourly = data.get("hourly", {})
    daily = data.get("daily", {})
    
    soil_moisture = hourly.get("soil_moisture_0_to_1cm", [None])[0] if hourly.get("soil_moisture_0_to_1cm") else None
    et0 = hourly.get("et0_fao_evapotranspiration", [None])[0] if hourly.get("et0_fao_evapotranspiration") else None
    wet_bulb = hourly.get("wet_bulb_temperature_2m", [None])[0] if hourly.get("wet_bulb_temperature_2m") else None
    solar_rad = hourly.get("shortwave_radiation", [None])[0] if hourly.get("shortwave_radiation") else None
    precip_prob = hourly.get("precipitation_probability", [None])[0] if hourly.get("precipitation_probability") else None
    
    result = {
        "location": USER_LOCATION["name"],
        "latitude": lat,
        "longitude": lon,
        "temperature": current.get("temperature_2m"),
        "apparent_temperature": current.get("apparent_temperature"),
        "humidity": current.get("relative_humidity_2m"),
        "precipitation": current.get("precipitation"),
        "precipitation_probability": precip_prob,
        "wind_speed": current.get("wind_speed_10m"),
        "wind_direction": current.get("wind_direction_10m"),
        "cloud_cover": current.get("cloud_cover"),
        "soil_moisture": soil_moisture,
        "evapotranspiration": et0,
        "wet_bulb_temperature": wet_bulb,
        "solar_radiation": solar_rad,
        "daily_forecast": {
            "dates": daily.get("time", []),
            "max_temp": daily.get("temperature_2m_max", []),
            "min_temp": daily.get("temperature_2m_min", []),
            "precipitation_sum": daily.get("precipitation_sum", []),
            "precip_probability_max": daily.get("precipitation_probability_max", [])
        },
        "data_source": "Open-Meteo Forecast API"
    }
    return json.dumps(result, indent=2)


@tool
def get_heat_risk() -> str:
    """Calculate a deterministic heat-risk score (0-100) and category (LOW, MODERATE, ELEVATED, HIGH, EXTREME)
    based on real Open-Meteo temperature, apparent temperature, humidity, wet-bulb temp, wind speed, and solar radiation.
    """
    lat = USER_LOCATION["latitude"]
    lon = USER_LOCATION["longitude"]
    data = _fetch_open_meteo_forecast(lat, lon)
    if not data:
        return "Data unavailable from Open-Meteo."
    
    current = data.get("current", {})
    hourly = data.get("hourly", {})
    daily = data.get("daily", {})
    
    temp = current.get("temperature_2m")
    if temp is None:
        temp = daily.get("temperature_2m_max", [30.0])[0] if daily.get("temperature_2m_max") else 30.0
        
    app_temp = current.get("apparent_temperature")
    if app_temp is None:
        app_temp = temp
        
    humidity = current.get("relative_humidity_2m", 50)
    wind_speed = current.get("wind_speed_10m", 10.0)
    
    wet_bulb = hourly.get("wet_bulb_temperature_2m", [None])[0] if hourly.get("wet_bulb_temperature_2m") else None
    solar_rad = hourly.get("shortwave_radiation", [None])[0] if hourly.get("shortwave_radiation") else None
    
    # Deterministic Heat-Risk Score Calculation (0-100)
    if app_temp <= 20:
        base_score = max(0.0, (app_temp / 20.0) * 15.0)
    elif app_temp <= 28:
        base_score = 15.0 + ((app_temp - 20.0) / 8.0) * 20.0
    elif app_temp <= 35:
        base_score = 35.0 + ((app_temp - 28.0) / 7.0) * 25.0
    elif app_temp <= 42:
        base_score = 60.0 + ((app_temp - 35.0) / 7.0) * 25.0
    else:
        base_score = 85.0 + min(15.0, ((app_temp - 42.0) / 8.0) * 15.0)
        
    score = base_score
    if humidity > 70 and temp > 30:
        score += 5.0
    if wind_speed < 5.0:
        score += 5.0
    if wet_bulb is not None and wet_bulb > 28.0:
        score += 5.0
    if solar_rad is not None and solar_rad > 600.0:
        score += 5.0
        
    final_score = round(min(100.0, max(0.0, score)))
    
    if final_score <= 20:
        risk_cat = "LOW"
    elif final_score <= 40:
        risk_cat = "MODERATE"
    elif final_score <= 60:
        risk_cat = "ELEVATED"
    elif final_score <= 80:
        risk_cat = "HIGH"
    else:
        risk_cat = "EXTREME"
        
    result = {
        "heat_risk": risk_cat,
        "score": final_score,
        "temperature": temp,
        "apparent_temperature": app_temp,
        "humidity": humidity,
        "wet_bulb_temperature": wet_bulb if wet_bulb is not None else "N/A",
        "wind_speed": wind_speed,
        "solar_radiation": solar_rad if solar_rad is not None else "N/A",
        "calculation_method": "Deterministic Python formula based on apparent temperature, relative humidity, wind speed, wet-bulb temp, and solar radiation.",
        "data_source": "Open-Meteo Forecast API"
    }
    return json.dumps(result, indent=2)


@tool
def get_flood_risk() -> str:
    """Calculate a deterministic weather-based flood/waterlogging risk indicator (0-100 score and category)
    based on real Open-Meteo forecast precipitation, precipitation probability, and soil moisture.
    """
    lat = USER_LOCATION["latitude"]
    lon = USER_LOCATION["longitude"]
    data = _fetch_open_meteo_forecast(lat, lon)
    if not data:
        return "Data unavailable from Open-Meteo."
    
    current = data.get("current", {})
    hourly = data.get("hourly", {})
    daily = data.get("daily", {})
    
    precip_sum = daily.get("precipitation_sum", [0.0])[0] if daily.get("precipitation_sum") else current.get("precipitation", 0.0)
    precip_prob = daily.get("precipitation_probability_max", [0])[0] if daily.get("precipitation_probability_max") else 0
    soil_moisture = hourly.get("soil_moisture_0_to_1cm", [0.2])[0] if hourly.get("soil_moisture_0_to_1cm") else 0.2
    if soil_moisture is None:
        soil_moisture = 0.2
        
    # Deterministic Flood Risk Calculation (0-100)
    precip_score = min(60.0, (precip_sum / 60.0) * 60.0)
    soil_score = min(25.0, (max(0.0, soil_moisture - 0.1) / 0.3) * 25.0)
    prob_score = (precip_prob / 100.0) * 15.0
    
    final_score = round(min(100.0, max(0.0, precip_score + soil_score + prob_score)))
    
    if final_score <= 20:
        risk_cat = "LOW"
    elif final_score <= 40:
        risk_cat = "MODERATE"
    elif final_score <= 60:
        risk_cat = "ELEVATED"
    elif final_score <= 80:
        risk_cat = "HIGH"
    else:
        risk_cat = "EXTREME"
        
    result = {
        "flood_risk": risk_cat,
        "score": final_score,
        "forecast_precipitation": precip_sum,
        "precipitation_probability": precip_prob,
        "soil_moisture": soil_moisture,
        "indicator_type": "Weather-based flood/waterlogging risk indicator",
        "limitation": "This is a weather-based indicator and does not represent confirmed local flooding.",
        "data_source": "Open-Meteo Forecast API"
    }
    return json.dumps(result, indent=2)


@tool
def get_water_risk() -> str:
    """Calculate a deterministic weather-derived water-stress indicator (0-100 score and category)
    based on real Open-Meteo precipitation, soil moisture, temperature, and evapotranspiration.
    """
    lat = USER_LOCATION["latitude"]
    lon = USER_LOCATION["longitude"]
    data = _fetch_open_meteo_forecast(lat, lon)
    if not data:
        return "Data unavailable from Open-Meteo."
    
    current = data.get("current", {})
    hourly = data.get("hourly", {})
    daily = data.get("daily", {})
    
    temp = current.get("temperature_2m", 25.0)
    precip_sum = daily.get("precipitation_sum", [0.0])[0] if daily.get("precipitation_sum") else current.get("precipitation", 0.0)
    soil_moisture = hourly.get("soil_moisture_0_to_1cm", [0.25])[0] if hourly.get("soil_moisture_0_to_1cm") else 0.25
    if soil_moisture is None:
        soil_moisture = 0.25
    et0 = hourly.get("et0_fao_evapotranspiration", [3.0])[0] if hourly.get("et0_fao_evapotranspiration") else 3.0
    if et0 is None:
        et0 = 3.0
        
    # Deterministic Water Stress Calculation (0-100)
    net_deficit = max(0.0, (et0 * 2.4) - precip_sum)
    deficit_score = min(40.0, (net_deficit / 8.0) * 40.0)
    dryness_score = min(35.0, max(0.0, (0.35 - soil_moisture) / 0.25) * 35.0)
    temp_stress = min(25.0, max(0.0, (temp - 25.0) / 20.0) * 25.0)
    
    final_score = round(min(100.0, max(0.0, deficit_score + dryness_score + temp_stress)))
    
    if final_score <= 20:
        risk_cat = "LOW"
    elif final_score <= 40:
        risk_cat = "MODERATE"
    elif final_score <= 60:
        risk_cat = "ELEVATED"
    elif final_score <= 80:
        risk_cat = "HIGH"
    else:
        risk_cat = "EXTREME"
        
    result = {
        "water_risk": risk_cat,
        "score": final_score,
        "meteorological_factors": {
            "temperature": temp,
            "precipitation": precip_sum,
            "soil_moisture": soil_moisture,
            "evapotranspiration": et0,
            "net_moisture_deficit": round(net_deficit, 2)
        },
        "indicator_type": "Weather-derived water stress indicator",
        "limitations": "This is a weather-derived water stress indicator based on precipitation, soil moisture, and evapotranspiration. It does not measure actual groundwater levels, reservoir storage, drinking-water availability, or irrigation infrastructure.",
        "data_source": "Open-Meteo Forecast API"
    }
    return json.dumps(result, indent=2)


@tool
def get_historical_weather(start_date: str = None, end_date: str = None, days_back: int = 7) -> str:
    """Retrieve historical meteorological data from Open-Meteo Historical Weather API for the user's location.
    Use this tool when the user asks about past weather, historical rainfall, past temperatures, or comparing current weather with past trends.
    """
    lat = USER_LOCATION["latitude"]
    lon = USER_LOCATION["longitude"]
    
    today = datetime.date.today()
    if not end_date:
        end_date = (today - datetime.timedelta(days=2)).strftime("%Y-%m-%d")
    if not start_date:
        s_dt = datetime.datetime.strptime(end_date, "%Y-%m-%d").date() - datetime.timedelta(days=days_back)
        start_date = s_dt.strftime("%Y-%m-%d")
        
    data = _fetch_open_meteo_archive(lat, lon, start_date, end_date)
    if not data or "daily" not in data:
        return "Historical weather data unavailable from Open-Meteo."
        
    daily = data["daily"]
    max_temps = [t for t in daily.get("temperature_2m_max", []) if t is not None]
    min_temps = [t for t in daily.get("temperature_2m_min", []) if t is not None]
    mean_temps = [t for t in daily.get("temperature_2m_mean", []) if t is not None]
    precip_list = [p for p in daily.get("precipitation_sum", []) if p is not None]
    wind_list = [w for w in daily.get("wind_speed_10m_max", []) if w is not None]
    
    mean_max_t = round(sum(max_temps) / len(max_temps), 1) if max_temps else None
    mean_min_t = round(sum(min_temps) / len(min_temps), 1) if min_temps else None
    mean_t = round(sum(mean_temps) / len(mean_temps), 1) if mean_temps else None
    total_p = round(sum(precip_list), 1) if precip_list else 0.0
    max_w = max(wind_list) if wind_list else None
    
    result = {
        "location": USER_LOCATION["name"],
        "latitude": lat,
        "longitude": lon,
        "period": f"{start_date} to {end_date}",
        "historical_data": {
            "mean_temperature": mean_t,
            "mean_max_temperature": mean_max_t,
            "mean_min_temperature": mean_min_t,
            "total_precipitation": total_p,
            "max_wind_speed": max_w
        },
        "daily_records_summary": {
            "dates": daily.get("time", []),
            "max_temperatures": daily.get("temperature_2m_max", []),
            "min_temperatures": daily.get("temperature_2m_min", []),
            "precipitation": daily.get("precipitation_sum", [])
        },
        "data_source": "Open-Meteo Historical Weather API"
    }
    return json.dumps(result, indent=2)


@tool
def get_climate_guidelines(risk_type: str = "general") -> str:
    """Provide general climate-safety guidance based on calculated risk categories (heat, flood, water, or general).
    These are general safety recommendations and not official government directives.
    """
    guidelines = {
        "heat": [
            "Stay hydrated by drinking water regularly throughout the day.",
            "Avoid prolonged outdoor exposure during peak heat hours.",
            "Wear lightweight, light-colored clothing.",
            "Monitor vulnerable individuals for symptoms of heat stress."
        ],
        "flood": [
            "Monitor rainfall conditions and local weather alerts closely.",
            "Avoid unnecessary travel during severe rainfall.",
            "Do not walk or drive through visibly flooded areas.",
            "Keep emergency items accessible if heavy downpours persist."
        ],
        "water": [
            "Practice water conservation measures in daily activities.",
            "Protect topsoil moisture where applicable.",
            "Optimize watering/irrigation during cooler early morning or evening hours."
        ],
        "general": [
            "Stay updated with real-time meteorological forecasts.",
            "Prepare appropriate clothing and shelter based on weather warnings.",
            "Follow safety recommendations for extreme weather conditions."
        ]
    }
    
    rtype = risk_type.lower().strip()
    selected = guidelines.get(rtype, guidelines["general"])
    
    result = {
        "risk_type": rtype,
        "guidelines": selected,
        "disclaimer": "These guidelines are general safety recommendations derived from calculated risk categories. They do not constitute official government warnings or directives."
    }
    return json.dumps(result, indent=2)


def print_safe(text: str):
    """Safely print strings with fallback for non-UTF8 terminals."""
    try:
        print(text)
    except UnicodeEncodeError:
        safe_text = text.replace("✓", "[v]")
        print(safe_text)


def create_agent():
    """Create and return configured LangGraph climate agent."""
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        api_key=OPENAI_API_KEY,
        temperature=0.1
    )

    tools = [
        get_weather_forecast,
        get_heat_risk,
        get_flood_risk,
        get_water_risk,
        get_historical_weather,
        get_climate_guidelines
    ]

    return create_react_agent(
        model=llm,
        tools=tools,
        prompt=SYSTEM_PROMPT
    )


def main():
    print("==================================================")
    print("CLIMATE AI AGENT")
    print("==================================================")
    print()

    # User input for location
    try:
        loc_input = input("Enter location name: ").strip()
        lat_input = input("Enter latitude: ").strip()
        lon_input = input("Enter longitude: ").strip()
    except (EOFError, KeyboardInterrupt):
        print("\nExiting program.")
        sys.exit(0)

    loc_name = loc_input if loc_input else "Delhi"
    try:
        lat_val = float(lat_input) if lat_input else 28.6139
        lon_val = float(lon_input) if lon_input else 77.2090
    except ValueError:
        print("Invalid coordinates entered. Defaulting to Delhi (28.6139, 77.2090).")
        loc_name = "Delhi"
        lat_val = 28.6139
        lon_val = 77.2090

    USER_LOCATION["name"] = loc_name
    USER_LOCATION["latitude"] = lat_val
    USER_LOCATION["longitude"] = lon_val

    print(f"\nLocation: {USER_LOCATION['name']}")
    print(f"Latitude: {USER_LOCATION['latitude']}")
    print(f"Longitude: {USER_LOCATION['longitude']}")

    agent = create_agent()

    while True:
        print("\n--------------------------------------------------")
        try:
            question = input("Climate question (or type 'exit' to quit): ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nExiting program.")
            break

        if not question:
            continue

        if question.lower() in ["exit", "quit"]:
            print("Exiting Climate AI Agent. Goodbye!")
            break

        # Run agent
        try:
            res = agent.invoke({
                "messages": [("user", f"Location context: {USER_LOCATION['name']} (Lat: {USER_LOCATION['latitude']}, Lon: {USER_LOCATION['longitude']}). Question: {question}")]
            })
        except Exception as e:
            print(f"\nError executing agent: {e}")
            continue

        messages = res.get("messages", [])

        # Extract tools called
        called_tools = []
        for msg in messages:
            if isinstance(msg, ToolMessage) and msg.name:
                if msg.name not in called_tools:
                    called_tools.append(msg.name)

        # Cleanly extract text content of final response
        final_msg = messages[-1] if messages else None
        if final_msg:
            if isinstance(final_msg.content, list):
                text_parts = []
                for block in final_msg.content:
                    if isinstance(block, dict) and block.get("type") == "text":
                        text_parts.append(block.get("text", ""))
                    elif isinstance(block, str):
                        text_parts.append(block)
                final_answer = "\n".join(text_parts) if text_parts else str(final_msg.content)
            else:
                final_answer = str(final_msg.content)
        else:
            final_answer = "No response generated."

        # Format output
        print("\n--------------------------------------------------")
        print("TOOL CALLS")
        print("--------------------------------------------------")
        if called_tools:
            for t in called_tools:
                print_safe(f"✓ {t}")
        else:
            print("(No tools required)")

        print("\n--------------------------------------------------")
        print("ANALYSIS")
        print("--------------------------------------------------")
        print_safe(final_answer)

        print("\n--------------------------------------------------")
        print("DATA SOURCES")
        print("--------------------------------------------------")
        sources = set()
        if any(t in called_tools for t in ["get_weather_forecast", "get_heat_risk", "get_flood_risk", "get_water_risk"]):
            sources.add("Open-Meteo Forecast API")
        if "get_historical_weather" in called_tools:
            sources.add("Open-Meteo Historical Weather API")
        if "get_climate_guidelines" in called_tools:
            sources.add("General Safety Knowledgebase")
        if not sources:
            sources.add("None (Direct reasoning without external data tools)")
        for src in sorted(sources):
            print(src)

        print("\n--------------------------------------------------")
        print("LIMITATIONS")
        print("--------------------------------------------------")
        limitations = []
        if "get_heat_risk" in called_tools or "get_weather_forecast" in called_tools:
            limitations.append("- Heat risk score is a weather-based calculation and not a medical or physiological diagnostic.")
        if "get_flood_risk" in called_tools:
            limitations.append("- Flood risk is a weather-based indicator (precipitation/soil moisture) and does not represent confirmed street-level flooding or drainage capacity.")
        if "get_water_risk" in called_tools:
            limitations.append("- Water risk is a weather-derived stress indicator and does not measure actual groundwater, reservoir levels, or drinking water availability.")
        if "get_historical_weather" in called_tools:
            limitations.append("- Historical weather data depends on Open-Meteo archive availability and historical station reanalysis.")
        if not limitations:
            limitations.append("- Predictions are subject to meteorological model uncertainties.")

        for lim in limitations:
            print(lim)


if __name__ == "__main__":
    main()
