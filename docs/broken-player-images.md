# Broken Player Images Report

Updated: 2026-03-05

Total broken images: 10

## Context

All player images have been migrated from external URLs to our own S3 bucket (`5-06-sei`) under the path `lineup-legends/media/images/players/`, served via CloudFront at `https://d2uth2nw0znbpc.cloudfront.net/lineup-legends/media/images/players/`.

The migration script (`npm run db:migrate-images`) successfully migrated 301 out of 311 players. The 10 players listed below have broken source URLs that could not be downloaded. Their `imgUrl` still points to the original (dead) external URL.

To fix these, find a new source image for each player and update them via the admin panel.

## Players with Broken Images

| Player Name   | Value | Original URL                                                                                                                                           |
| ------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Tim Duncan    | $5    | https://media1.sacurrent.com/sacurrent/imager/spurs-power-forward-tim-duncan/u/original/2252760/sas_duncan_tim1jpg                                    |
| Elgin Baylor  | $4    | https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/Elgin_Baylor_Night_program-%28cropped%29.jpg/800px-Elgin_Baylor_Night_program-%28cropped%29.jpg |
| Mark Price    | $3    | https://www.oklahoman.com/gcdn/authoring/2014/03/02/NOKL/ghnewsok_gallery-OK-6031518-4982ec42.jpeg?width=430&height=610&fit=crop&format=pjpg&auto=webp |
| Mike Conley   | $3    | https://hoopshype.com/wp-content/uploads/sites/92/2018/10/i_a5_f3_40_mike-conley.png?w=190                                                             |
| Rajon Rondo   | $3    | https://banner2.cleanpng.com/20180622/guh/kisspng-rajon-rondo-team-sport-athlete-nba-5b2d1233234095.2282824215296804351444.jpg                         |
| Ben Simmons   | $2    | https://hoopshype.com/wp-content/uploads/sites/92/2021/09/i_e4_42_08_ben-simmons.png                                                                   |
| Joe Harris    | $2    | https://hoopshype.com/wp-content/uploads/sites/92/2022/01/i_fa_4d_5e_joe-harris.png                                                                    |
| Patty Mills   | $2    | https://netswire.usatoday.com/wp-content/uploads/sites/9/2021/09/USATSI_16841944-e1632863946258.jpg?w=1000&h=600&crop=1                                |
| Zach Randolph | $2    | https://www.athletespeakers.com/storage/celebrities/1532533978_zach-randolph.png                                                                       |
| Matt Barnes   | $1    | https://hoopshype.com/wp-content/uploads/sites/92/2017/01/i_56_8e_d6_matt-barnes.png?w=190                                                             |

## Summary by Value Tier

- **$5 Players**: 1 broken (Tim Duncan)
- **$4 Players**: 1 broken (Elgin Baylor)
- **$3 Players**: 3 broken
- **$2 Players**: 4 broken
- **$1 Players**: 1 broken

## Migration Details

- **Script**: `scripts/migrate-player-images.ts` (run via `npm run db:migrate-images`)
- **S3 key format**: `lineup-legends/media/images/players/{firstname}_{lastname}_{playerid}.png`
- **CDN URL format**: `https://d2uth2nw0znbpc.cloudfront.net/lineup-legends/media/images/players/{firstname}_{lastname}_{playerid}.png`
- **Idempotent**: Re-running the script skips already-migrated players and only retries failures
