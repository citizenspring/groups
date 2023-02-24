const TwitterEmbed = function ({ tweetUrl, format }) {
  if (format === "email")
    return (
      <span>
        (<a href={tweetUrl}>{tweetUrl}</a>)
      </span>
    );
  return (
    <div className="tweet" style={{ maxWidth: "560px", margin: "0 auto" }}>
      <blockquote className="twitter-tweet">
        <a href={`${tweetUrl}?ref_src=twsrc%5Etfw`}></a>
      </blockquote>
      <script async src="https://platform.twitter.com/widgets.js"></script>
    </div>
  );
};

export default TwitterEmbed;
