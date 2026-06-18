---
name: hyperlocal-weather-precip
description: Hyperlocal weather data - precipitation, temperature, wind, soil moisture and more
source: orthogonal
---


# Precip - Hyperlocal Weather Data API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Access hyperlocal weather data including precipitation, temperature, wind, soil conditions, and more.

## Capabilities

- **Last 48 Hours Precipitation Data**: Total precipitation in the last 48 hours for the given location(s)
- **Air Temperature**: Hourly near-surface air temperature in Celsius (°C)
- **Hourly Soil Moisture**: Hourly soil moisture percentage relative to holding capacity at 0-10cm depth
- **Wind Direction**: Hourly wind direction in compass degrees (0-360)
- **Daily Precipitation Data**: Returns comprehensive daily precipitation data for the given time range and location(s)
- **Wind Gusts**: Hourly wind gust speed in meters per second (m/s)
- **Recent Rain Event**: Returns detailed information about the most recent precipitation event for the given location(s), including total amounts, precipitation type (rain/snow), timing, and how long ago it occurred
- **Map Layer Tiles**: Map tiles compatible with most web mapping or GIS tools
- **Wind Speed**: Hourly near-surface wind speed in meters per second (m/s)
- **Cloud Cover**: Hourly cloud cover fraction (0-1, where 0 is clear and 1 is overcast)
- **Soil Temperature**: Hourly soil temperature data at 0-10cm depth in Celsius (°C)
- **Specific Humidity**: Hourly specific humidity (kg/kg)
- **Hourly Precipitation Data**: Returns comprehensive hourly precipitation data for the given time range and location(s)
- **Daily Soil Moisture**: Daily soil moisture percentage relative to holding capacity at 0-10cm depth
- **Embeddable HTML UI**: Returns a complete, HTML page displaying comprehensive weather data for a specific location
- **Solar Radiation**: Hourly downward short-wave radiation flux in watts per square meter (W/m²)
- **Relative Humidity**: Hourly relative humidity as a percentage (0-100%)

## Usage

### Last 48 Hours Precipitation Data
Total precipitation in the last 48 hours for the given location(s).

Parameters:
- longitude* (string)
- latitude* (string)
- timeZoneId (string)
- format (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/last-48","query":{"latitude":"37.7749","longitude":"-122.4194"}}'
```

### Air Temperature
Hourly near-surface air temperature in Celsius (°C)

Parameters:
- start* (string)
- end* (string)
- longitude* (string) - Comma-separated list of longitude coordinates (WGS84)
- latitude* (string) - Comma-separated list of latitude coordinates (WGS84)
- timeZoneId (string) - IANA timezone identifier for localizing timestamps
- format (string) - Output format: `geojson`, `json` or `csv`

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/temperature-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-02"}}'
```

### Hourly Soil Moisture
Hourly soil moisture percentage relative to holding capacity at 0-10cm depth

Parameters:
- start* (string)
- end* (string)
- longitude* (string)
- latitude* (string)
- timeZoneId (string)
- format (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/soil-moisture-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-02"}}'
```

### Wind Direction
Hourly wind direction in compass degrees (0-360)

Parameters:
- start* (string)
- end* (string)
- longitude* (string) - Comma-separated list of longitude coordinates (WGS84)
- latitude* (string) - Comma-separated list of latitude coordinates (WGS84)
- timeZoneId (string) - IANA timezone identifier for localizing timestamps
- format (string) - Output format: `geojson`, `json` or `csv`

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/wind-direction-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-02"}}'
```

### Daily Precipitation Data
Returns comprehensive daily precipitation data for the given time range and location(s). Each day includes precipitation amount, type (rain/snow/mixed), probability (for forecasts), and data source. Seamlessly combines historical observations with forecast data depending on the requested time range.

Parameters:
- start* (string)
- end* (string)
- longitude* (string)
- latitude* (string)
- timeZoneId (string)
- format (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/daily","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-31"}}'
```

### Wind Gusts
Hourly wind gust speed in meters per second (m/s)

Parameters:
- start* (string)
- end* (string)
- longitude* (string) - Comma-separated list of longitude coordinates (WGS84)
- latitude* (string) - Comma-separated list of latitude coordinates (WGS84)
- timeZoneId (string) - IANA timezone identifier for localizing timestamps
- format (string) - Output format: `geojson`, `json` or `csv`

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/wind-speed-gust-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-02"}}'
```

### Recent Rain Event
Returns detailed information about the most recent precipitation event for the given location(s), including total amounts, precipitation type (rain/snow), timing, and how long ago it occurred.

Parameters:
- longitude* (string)
- latitude* (string)
- timeZoneId (string)
- format (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/recent-rain","query":{"latitude":"37.7749","longitude":"-122.4194"}}'
```

### Map Layer Tiles
Map tiles compatible with most web mapping or GIS tools. Software such as Mapbox, Google Maps, ArcGIS, Leaflet, OpenLayers or QGIS will require an `x/y/z` url eg `https://api.precip.ai/api/v1/map/last-48/ImageServer/tile/{z}/{y}/{x}`. See the examples for more details.

Parameters:
- time (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/map/precipitation/ImageServer/tile/5/12/10"}'
```

### Wind Speed
Hourly near-surface wind speed in meters per second (m/s)

Parameters:
- start* (string)
- end* (string)
- longitude* (string) - Comma-separated list of longitude coordinates (WGS84)
- latitude* (string) - Comma-separated list of latitude coordinates (WGS84)
- timeZoneId (string) - IANA timezone identifier for localizing timestamps
- format (string) - Output format: `geojson`, `json` or `csv`

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/wind-speed-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-02"}}'
```

### Cloud Cover
Hourly cloud cover fraction (0-1, where 0 is clear and 1 is overcast)

Parameters:
- start* (string)
- end* (string)
- longitude* (string) - Comma-separated list of longitude coordinates (WGS84)
- latitude* (string) - Comma-separated list of latitude coordinates (WGS84)
- timeZoneId (string) - IANA timezone identifier for localizing timestamps
- format (string) - Output format: `geojson`, `json` or `csv`

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/cloud-cover-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-02"}}'
```

### Soil Temperature
Hourly soil temperature data at 0-10cm depth in Celsius (°C)

Parameters:
- start* (string)
- end* (string)
- longitude* (string) - Comma-separated list of longitude coordinates (WGS84)
- latitude* (string) - Comma-separated list of latitude coordinates (WGS84)
- timeZoneId (string) - IANA timezone identifier for localizing timestamps
- format (string) - Output format: `geojson`, `json` or `csv`

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/temp-0-10cm-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-02"}}'
```

### Specific Humidity
Hourly specific humidity (kg/kg)

Parameters:
- start* (string)
- end* (string)
- longitude* (string) - Comma-separated list of longitude coordinates (WGS84)
- latitude* (string) - Comma-separated list of latitude coordinates (WGS84)
- timeZoneId (string) - IANA timezone identifier for localizing timestamps
- format (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/specific-humidity-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-02"}}'
```

### Hourly Precipitation Data
Returns comprehensive hourly precipitation data for the given time range and location(s). Each hour includes precipitation amount, type (rain/snow/mixed), probability (for forecasts), and data source.

Parameters:
- start* (string)
- end* (string)
- longitude* (string)
- latitude* (string)
- timeZoneId (string)
- format (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-07"}}'
```

### Daily Soil Moisture
Daily soil moisture percentage relative to holding capacity at 0-10cm depth

Parameters:
- start* (string)
- end* (string)
- longitude* (string)
- latitude* (string)
- timeZoneId (string)
- format (string)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/soil-moisture-daily","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-31"}}'
```

### Embeddable HTML UI
Returns a complete, HTML page displaying comprehensive weather data for a specific location. See the examples page for more details. 

 Authorization headers set automatically from query parameters on this endpoint.

Parameters:
- lat* (number) - Latitude coordinate (-90 to 90) for the location center of the precipitation widget
- lon* (number) - Longitude coordinate (-180 to 180) for the location center of the precipitation widget
- apiKey* (string) - Your API key for authentication. Gets automatically applied as header.
- units (string) - Unit system for displaying precipitation amounts and temperatures. 'metric' shows mm and °C, 'imperial' shows inches and °F.
- widgets (string) - Comma-separated list of widget keys to display.

Available options:
`current`, `event`, `calendar`, `cumulative`, `total`, `precip`, `table`, `wind`, `temp`, `soiltemp`, `soilmoisture`, `snow`

When not provided, shows all widgets.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/embed/location","query":{"lat":"37.7749","lon":"-122.4194"}}'
```

### Solar Radiation
Hourly downward short-wave radiation flux in watts per square meter (W/m²)

Parameters:
- start* (string)
- end* (string)
- longitude* (string) - Comma-separated list of longitude coordinates (WGS84)
- latitude* (string) - Comma-separated list of latitude coordinates (WGS84)
- timeZoneId (string) - IANA timezone identifier for localizing timestamps
- format (string) - Output format: `geojson`, `json` or `csv`

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/solar-radiation-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-02"}}'
```

### Relative Humidity
Hourly relative humidity as a percentage (0-100%)

Parameters:
- start* (string)
- end* (string)
- longitude* (string) - Comma-separated list of longitude coordinates (WGS84)
- latitude* (string) - Comma-separated list of latitude coordinates (WGS84)
- timeZoneId (string) - IANA timezone identifier for localizing timestamps
- format (string) - Output format: `geojson`, `json` or `csv`

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/relative-humidity-hourly","query":{"latitude":"37.7749","longitude":"-122.4194","start":"2024-01-01","end":"2024-01-02"}}'
```

## Use Cases

1. **Agriculture**: Monitor soil moisture and plan irrigation
2. **Construction**: Track weather conditions for project planning
3. **Event Planning**: Check precipitation forecasts for outdoor events
4. **Research**: Access historical weather data for analysis
5. **IoT/Smart Home**: Integrate weather data into automation

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"precip API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"precip","path":"/api/v1/last-48"}'   # Get endpoint details
```
