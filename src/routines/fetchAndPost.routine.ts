import { Client, RichEmbed, TextChannel } from 'discord.js';

import { RedditPost } from '../reddit/RedditPost';
import { SubredditFetcher } from '../reddit/SubredditFetcher';
import { TwitterPoster } from '../twitter/TwitterPoster';

export const startFetchAndPostRoutine = async (
  delaySeconds: number,
  subreddit: string,
  discordClient: Client
): Promise<void> => {
  const chan = discordClient.channels.find(
    channel => channel.id === '675271307696406545'
  );

  const fetchAndPost = async () => {
    console.log('Started fetching subreddit posts');

    const fetcher = new SubredditFetcher(subreddit);
    const poster = new TwitterPoster();

    const posts = await fetcher.getLatestPostsSince(delaySeconds);
    posts.forEach(async post => {
      console.log(`> Posting: ${post.title}`);

      try {
        const embed: RichEmbed = buildEmbed(post);
        await (chan as TextChannel).send(embed);
        console.log(`  > Successfully posted to Discord: ${post.title}`);
      } catch (err) {
        console.error(
          `  > Failed posting to Discord (${post.title}): ${err.message}`
        );
      }

      try {
        const status = buildTweet(post);
        await poster.tweet(status);
        console.log(`  > Successfully posted to Twitter: ${post.title}`);
      } catch (err) {
        console.error(
          `  > Failed posting to Twitter (${post.title}): ${err.message}`
        );
      }
    });

    console.log('Done fetching subreddit posts');
  };

  await fetchAndPost();
  setInterval(fetchAndPost, delaySeconds * 1000);
};

const buildEmbed = (post: RedditPost): RichEmbed => {
  const embed = new RichEmbed();

  embed.setAuthor(`New post on r/zoemains ! ${post.flair}`);
  embed.setTitle(post.title);
  embed.setURL(post.url);
  embed.setColor('#9230a7');

  if (post.self) {
    embed.setDescription(post.selfText);
  } else if (post.hasMedia) {
    embed.setImage(post.thumbnail);
    embed.setDescription('This post contains media...');
  } else {
    embed.setImage(post.image);
  }

  embed.setThumbnail('https://i.imgur.com/cjPynWD.png');

  embed.setFooter(
    `Posted by u/${post.author}`,
    'https://www.redditstatic.com/desktop2x/img/favicon/favicon-32x32.png'
  );

  return embed;
};

const buildTweet = (post: RedditPost): string => {
  const title =
    post.title.length < 100 ? post.title : `${post.title.substring(0, 100)}...`;
  const hashtags = '#LeagueOfLegends #ZoeMains';

  return `${post.flair}\n\n${title}\n\nby u/${post.author}\n\n${hashtags}\n${post.url}`;
};
