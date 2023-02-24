const YouTubeEmbed = ({ id, format }) => {
  if (format === "email") {
    return (
      <p align="center">
        <div
          className="center video thumbnail imageWrapper fullWidth"
          style={{
            width: "600px",
            maxWidth: "100%",
          }}
        >
          <a href={`https://youtu.be/${id}`}>
            <img
              src={`https://img.youtube.com/vi/${id}/maxresdefault.jpg`}
              alt="video thumbnail"
              width={600}
            />
          </a>
          (<a href={`https://youtu.be/${id}`}>{`https://youtu.be/${id}`}</a>)
        </div>
      </p>
    );
  }

  return (
    <div
      className="video full-width"
      style={{
        position: "relative",
        paddingBottom: "56.25%" /* 16:9 */,
        paddingTop: 0.25,
        height: 0,
      }}
    >
      <iframe
        title="YouTube video embed"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
        }}
        src={`https://www.youtube.com/embed/${id}`}
        allowFullScreen
      />
    </div>
  );
};

export default YouTubeEmbed;
