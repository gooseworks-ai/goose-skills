---
name: prediction-markets-dome
description: Prediction markets data - Polymarket, Kalshi markets, prices, positions, and trades
source: orthogonal
---


# Dome - Prediction Markets API

## Setup

Read your credentials from ~/.gooseworks/credentials.json:
```bash
export GOOSEWORKS_API_KEY=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json'))['api_key'])")
export GOOSEWORKS_API_BASE=$(python3 -c "import json;print(json.load(open('$HOME/.gooseworks/credentials.json')).get('api_base','https://api.gooseworks.ai'))")
```

If ~/.gooseworks/credentials.json does not exist, tell the user to run: `npx gooseworks login`

All endpoints use Bearer auth: `-H "Authorization: Bearer $GOOSEWORKS_API_KEY"`


Access data from Polymarket and Kalshi prediction markets.

## Capabilities

- **Orderbook History**: Fetches historical orderbook snapshots for a specific Kalshi market (ticker) over a specified time range
- **Market Price**: Fetches the current market price for a market by token_id
- **Market Price**: Fetches the current market price for a Kalshi market by market_ticker
- **Trade History**: Fetches historical trade data for Kalshi markets with optional filtering by ticker and time range
- **Sport by Date**: Find equivalent markets across different prediction market platforms (Polymarket, Kalshi, etc
- **Sports**: Find equivalent markets across different prediction market platforms (Polymarket, Kalshi, etc
- **Positions**: Fetches all Polymarket positions for a proxy wallet address
- **Binance Prices**: Fetches historical crypto price data from Binance
- **Activity**: Fetches activity data for a specific user with optional filtering by market, condition, and time range
- **Markets**: Find markets on Polymarket using various filters including the ability to search
- **Orderbook History**: Fetches historical orderbook snapshots for a specific asset (token ID) over a specified time range
- **Wallet**: Fetches wallet information by providing either an EOA (Externally Owned Account) address or a proxy wallet address
- **Candlesticks**: Fetches historical candlestick data for a market identified by condition_id, over a specified interval
- **Chainlink Prices**: Fetches historical crypto price data from Chainlink
- **Wallet Profit-and-Loss**: Fetches the realized profit and loss (PnL) for a specific wallet address over a specified time range and granularity
- **Trade History**: Fetches historical trade data with optional filtering by market, condition, token, time range, and user’s wallet address
- **Markets**: Find markets on Kalshi using various filters including market ticker, event ticker, status, and volume

## Usage

### Orderbook History
Fetches historical orderbook snapshots for a specific Kalshi market (ticker) over a specified time range. If no start_time and end_time are provided, returns the latest orderbook snapshot for the market.

Parameters:
- ticker* (string) - The Kalshi market ticker
- start_time (integer) - Start time in Unix timestamp (milliseconds). Optional - if not provided along with end_time, returns the latest orderbook snapshot.
- end_time (integer) - End time in Unix timestamp (milliseconds). Optional - if not provided along with start_time, returns the latest orderbook snapshot.
- limit (integer) - Maximum number of snapshots to return (default: 100, max: 200). Ignored when fetching the latest orderbook without start_time and end_time.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/kalshi/orderbooks","query":{"ticker":"{ticker}"}}'
```

### Market Price
Fetches the current market price for a market by token_id. Allows historical lookups via the at_time query parameter.

Parameters:
- at_time (integer) - Optional Unix timestamp (in seconds) to fetch a historical market price. If not provided, returns the most real-time price available.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/polymarket/market-price/{token_id}"}'
```

### Market Price
Fetches the current market price for a Kalshi market by market_ticker. Returns prices for both yes and no sides. Allows historical lookups via the at_time query parameter.

Parameters:
- at_time (integer) - Optional Unix timestamp (in seconds) to fetch a historical market price. If not provided, returns the most real-time price available.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/kalshi/market-price/{market_ticker}"}'
```

### Trade History
Fetches historical trade data for Kalshi markets with optional filtering by ticker and time range. Returns executed trades with pricing, volume, and taker side information. All timestamps are in seconds.

Parameters:
- ticker (string) - The Kalshi market ticker to filter trades
- start_time (integer) - Start time in Unix timestamp (seconds)
- end_time (integer) - End time in Unix timestamp (seconds)
- limit (integer) - Maximum number of trades to return (default: 100)
- offset (integer) - Number of trades to skip for pagination

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/kalshi/trades","query":{"ticker":"{ticker}"}}'
```

### Sport by Date
Find equivalent markets across different prediction market platforms (Polymarket, Kalshi, etc.) for sports events by sport and date.

Parameters:
- date* (string) - The date to find matching markets for in YYYY-MM-DD format

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/matching-markets/sports/nba","query":{"date":"2024-03-01"}}'
```

### Sports
Find equivalent markets across different prediction market platforms (Polymarket, Kalshi, etc.) for sports events using a Polymarket market slug or a Kalshi event ticker.

Parameters:
- polymarket_market_slug (string[]) - The Polymarket market slug(s) to find matching markets for. To get multiple markets at once, provide the query param multiple times with different slugs. Can not be combined with kalshi_event_ticker.
- kalshi_event_ticker (string[]) - The Kalshi event ticker(s) to find matching markets for. To get multiple markets at once, provide the query param multiple times with different tickers. Can not be combined with polymarket_market_slug.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/matching-markets/sports"}'
```

### Positions
Fetches all Polymarket positions for a proxy wallet address. Returns positions with balance >= 10,000 shares (0.01 normalized) with market info.

Parameters:
- limit (integer) - Maximum number of positions to return per page. Defaults to 100, maximum 100.
- pagination_key (string) - Pagination key returned from previous request to fetch next page of results

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/polymarket/positions/wallet/{wallet_address}"}'
```

### Binance Prices
Fetches historical crypto price data from Binance. Returns price data for a specific currency pair over an optional time range. When no time range is provided, returns the most recent price. All timestamps are in Unix milliseconds.

Parameters:
- currency* (string) - The currency pair symbol. Must be lowercase alphanumeric with no separators (e.g., btcusdt, ethusdt, solusdt, xrpusdt).
- start_time (integer) - Start time in Unix timestamp (milliseconds). If not provided along with end_time, returns the most recent price (limit 1).
- end_time (integer) - End time in Unix timestamp (milliseconds). If not provided along with start_time, returns the most recent price (limit 1).
- limit (integer) - Maximum number of prices to return (default: 100, max: 100). When no time range is provided, limit is automatically set to 1.
- pagination_key (string) - Pagination key (base64-encoded) to fetch the next page of results. Returned in the response when more data is available.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/crypto-prices/binance","query":{"currency":"btcusdt"}}'
```

### Activity
Fetches activity data for a specific user with optional filtering by market, condition, and time range. Returns trading activity including MERGES, SPLITS, and REDEEMS.

Parameters:
- user* (string) - User wallet address to fetch activity for
- start_time (integer) - Filter activity from this Unix timestamp in seconds (inclusive)
- end_time (integer) - Filter activity until this Unix timestamp in seconds (inclusive)
- market_slug (string) - Filter activity by market slug
- condition_id (string) - Filter activity by condition ID
- limit (integer) - Number of activities to return (1-1000)
- offset (integer) - Number of activities to skip for pagination

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/polymarket/activity","query":{"user":"{wallet_address}"}}'
```

### Markets
Find markets on Polymarket using various filters including the ability to search

Parameters:
- market_slug (string[]) - Filter markets by market slug(s). Can provide multiple values.
- event_slug (string[]) - Filter markets by event slug(s). Can provide multiple values.
- condition_id (string[]) - Filter markets by condition ID(s). Can provide multiple values.
- tags (string[]) - Filter markets by tag(s). Can provide multiple values.
- search (string) - Search markets by keywords in title and description. Must be URL encoded (e.g., 'bitcoin%20price' for 'bitcoin price').
- status (enum<string>) - Filter markets by status (whether they're open or closed)
- min_volume (number) - Filter markets with total trading volume greater than or equal to this amount (USD)
- limit (integer) - Number of markets to return (1-100). Default: 10 for search, 10 for regular queries.
- offset (integer) - Number of markets to skip for pagination
- start_time (integer) - Filter markets from this Unix timestamp in seconds (inclusive)
- end_time (integer) - Filter markets until this Unix timestamp in seconds (inclusive)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/polymarket/markets","query":{"search":"election"}}'
```

### Orderbook History
Fetches historical orderbook snapshots for a specific asset (token ID) over a specified time range. If no start_time and end_time are provided, returns the latest orderbook snapshot for the market.

Parameters:
- token_id* (string) - The token id (asset) for the Polymarket market
- start_time (integer) - Start time in Unix timestamp (milliseconds). Optional - if not provided along with end_time, returns the latest orderbook snapshot.
- end_time (integer) - End time in Unix timestamp (milliseconds). Optional - if not provided along with start_time, returns the latest orderbook snapshot.
- limit (integer) - Maximum number of snapshots to return (default: 100, max: 200). Ignored when fetching the latest orderbook without start_time and end_time.
- pagination_key (string) - Pagination key to get the next chunk of data. Ignored when fetching the latest orderbook without start_time and end_time.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/polymarket/orderbooks","query":{"token_id":"{token_id}"}}'
```

### Wallet
Fetches wallet information by providing either an EOA (Externally Owned Account) address or a proxy wallet address. Returns the associated EOA, proxy, and wallet type. Optionally returns trading metrics including total volume, number of trades, and unique markets traded when with_metrics=true.

Parameters:
- eoa (string) - EOA (Externally Owned Account) wallet address. Either eoa or proxy must be provided, but not both.
- proxy (string) - Proxy wallet address. Either eoa or proxy must be provided, but not both.
- with_metrics (enum<string>) - Whether to include wallet trading metrics (total volume, trades, and markets). Pass true to include metrics. Metrics are computed only when explicitly requested for performance reasons.
- start_time (integer) - Optional start date for metrics calculation (Unix timestamp in seconds). Only used when with_metrics=true.
- end_time (integer) - Optional end date for metrics calculation (Unix timestamp in seconds). Only used when with_metrics=true.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/polymarket/wallet","query":{"address":"{wallet_address}"}}'
```

### Candlesticks
Fetches historical candlestick data for a market identified by condition_id, over a specified interval.

Parameters:
- start_time* (integer) - Unix timestamp (in seconds) for start of time range
- end_time* (integer) - Unix timestamp (in seconds) for end of time range
- interval (enum<integer>) - Interval length: 1 = 1m, 60 = 1h, 1440 = 1d. Defaults to 1m. ⚠️ Note: There are range limits for interval — specifically: 1 (1m): max range 1 week 60 (1h): max range 1 month 1440 (1d): max range 1 year

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/polymarket/candlesticks/{condition_id}","query":{"interval":"1h"}}'
```

### Chainlink Prices
Fetches historical crypto price data from Chainlink. Returns price data for a specific currency pair over an optional time range. When no time range is provided, returns the most recent price. All timestamps are in Unix milliseconds. Currency format: slash-separated (e.g., btc/usd, eth/usd).

Parameters:
- currency* (string) - The currency pair symbol. Must be slash-separated (e.g., btc/usd, eth/usd, sol/usd, xrp/usd).
- start_time (integer) - Start time in Unix timestamp (milliseconds). If not provided along with end_time, returns the most recent price (limit 1).
- end_time (integer) - End time in Unix timestamp (milliseconds). If not provided along with start_time, returns the most recent price (limit 1).
- limit (integer) - Maximum number of prices to return (default: 100, max: 100). When no time range is provided, limit is automatically set to 1.
- pagination_key (string) - Pagination key (base64-encoded) to fetch the next page of results. Returned in the response when more data is available.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/crypto-prices/chainlink","query":{"currency":"btc/usd"}}'
```

### Wallet Profit-and-Loss
Fetches the realized profit and loss (PnL) for a specific wallet address over a specified time range and granularity. Note: This will differ to what you see on Polymarket’s dashboard since Polymarket showcases historical unrealized PnL.

Parameters:
- granularity* (enum<string>) - Example: "day"
- start_time (integer) - Defaults to first day of first trade if not provided.
- end_time (integer) - Defaults to the current date if not provided.

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/polymarket/wallet/pnl/{wallet_address}"}'
```

### Trade History
Fetches historical trade data with optional filtering by market, condition, token, time range, and user’s wallet address.

Parameters:
- market_slug (string) - Filter orders by market slug
- condition_id (string) - Filter orders by condition ID
- token_id (string) - Filter orders by token ID
- start_time (integer) - Filter orders from this Unix timestamp in seconds (inclusive)
- end_time (integer) - Filter orders until this Unix timestamp in seconds (inclusive)
- limit (integer) - Number of orders to return (1-1000)
- offset (integer) - Number of orders to skip for pagination
- user (string) - Filter orders by user (wallet address)

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/polymarket/orders","query":{"market":"{market_id}"}}'
```

### Markets
Find markets on Kalshi using various filters including market ticker, event ticker, status, and volume

Parameters:
- market_ticker (string[]) - Filter markets by market ticker(s). Can provide multiple values.
- event_ticker (string[]) - Filter markets by event ticker(s). Can provide multiple values.
- search (string) - Search markets by keywords in title and description. Must be URL encoded (e.g., 'bitcoin%20price' for 'bitcoin price').
- status (enum<string>) - Filter markets by status (whether they're open or closed)
- min_volume (number) - Filter markets with total trading volume greater than or equal to this amount (in dollars)
- limit (integer) - Number of markets to return (1-100). Default: 10.
- offset (integer) - Number of markets to skip for pagination

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/run \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/kalshi/markets","query":{"search":"fed%20rate"}}'
```

## Use Cases

1. **Market Research**: Track prediction market sentiment
2. **Trading Analysis**: Analyze historical prices and orderbooks
3. **Portfolio Tracking**: Monitor positions and P&L
4. **Arbitrage**: Find price differences across platforms
5. **Forecasting**: Use market prices as probability estimates

## Discover More

For full endpoint details and parameters:

```bash
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/search \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"prompt":"dome API endpoints"}' List all endpoints
curl -s -X POST $GOOSEWORKS_API_BASE/v1/proxy/orthogonal/details \
  -H "Authorization: Bearer $GOOSEWORKS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"api":"dome","path":"/kalshi/orderbooks"}'   # Get endpoint details
```
