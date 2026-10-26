# Verdicts

Goose gives each Meta ad a verdict that compares it with the rest of its ad account. Repeat verdicts and numbers exactly as answers give them: every verdict, delay and tracking status comes from an answer, never from your own math.

## Reading results

- Pass on the tracking status and its fix steps exactly. Goose checks only the purchase event, and no purchases can simply mean no sales, so take tracking problems only from the tracking status. When the account has no sales or leads, ads are judged on click rate, which needs no tracking.
- Meta counts a sale up to 7 days after a click or 1 day after a view, so the last 7 days of results can still gain sales.
- Say an ad beats the account, never that it beats a target.
- Only when an answer's outcome is leads, say Goose counts ordinary leads, not qualified leads.

## What to do with each verdict

- **Winning:** build on it with new hooks, as a test against it through the ad-variations skill, or offer it more budget; the person picks the amount. An image ad Goose didn't make can't be tested that way yet: offer new ads in its look through the static-ads skill, with its ad from `gooseworks:ads_read` as referenceAdId.
- **Rising:** keep it, and say when to check back. When its reason says it had none before, call it an early sign.
- **Steady:** keep it, or test a new concept beside it. When its reason says Goose waits for more results before calling a winner, wait, and pass on how many.
- **Behind:** suggest pausing it, or launching a new ad in its place.
- **Tired:** 3 new hooks on the same ad, as a test against it through the ad-variations skill. For an image ad Goose didn't make, offer new ads in its look through the static-ads skill instead, with its ad from `gooseworks:ads_read` as referenceAdId.
- **Too early:** pass on what it still needs.
- **Not judged:** make no calls.

## How Goose judges an ad

- The account is judged on sales when it has any purchases in the period, else on leads when it has any, else on clicks. Its results are its purchases, leads or link clicks to match.
- The score, where higher is always better: value of sales ÷ spend when the account's sales carry a value; else purchases ÷ spend for sales; leads ÷ spend for leads; link clicks ÷ impressions for clicks. A score with nothing to divide by (no spend, or no impressions for clicks) is empty. The account's score is the same sum over every ad in the period, and an empty one counts as zero.
- Live days are the days in the period with impressions. Recent is the last 7 days. Earlier is the 23 days before them, days 8 to 30.
- An answer gives the verdict and a reason. The reason says which rule below gave it, and what a Too early ad still needs.

The first rule that fits gives the verdict, in this order:

1. **Not judged:** the account's results are still coming in.
2. **Not judged:** the account's results are over 2 days old.
3. **Not judged:** the days shown are today, which isn't over yet.
4. **Too early:** nothing spent.
5. **Too early:** live on fewer than 3 days.
6. **Too early:** under 1,000 impressions.
7. **Too early:** the account has results, and the ad spent under twice the account's spend ÷ results.
8. **Tired:** recent and earlier each have 1,000 or more impressions, and recent click rate (link clicks ÷ impressions) is at least 25% below earlier.
9. **Winning:** the account's score is above zero, the ad's score is at least 1.2 times the account's, and the ad has at least 10 sales, 10 leads or 100 link clicks, matching what the account is judged on.
10. **Steady:** the account's score is above zero, the ad's score is at least 1.2 times the account's, but the ad has fewer than 10 sales, 10 leads or 100 link clicks, matching what the account is judged on.
11. **Rising:** earlier has 1,000 or more impressions, recent has 3 or more results, both recent and earlier have a score, and the earlier score is zero.
12. **Rising:** earlier has 1,000 or more impressions, recent has 3 or more results, both recent and earlier have a score, and the recent score is at least 1.2 times the earlier one.
13. **Behind:** the ad's score, empty counting as zero, is below 0.8 times the account's.
14. **Steady:** anything else.
