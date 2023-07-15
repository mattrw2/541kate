import React from "react";

const videos = [
"https://www.youtube.com/embed/mKKIpWlvRZs",
"https://www.youtube.com/embed/CIinW8nGjF0",
"https://www.youtube.com/embed/zPvq4LGLNss",
"https://www.youtube.com/embed/AMo0MrGpad4",
"https://www.youtube.com/embed/YZpxSv4asGw",
"https://www.youtube.com/embed/tLIK4LPHLr0",
"https://www.youtube.com/embed/6YVlm25-ylw"
];

const France = () => {
  return (
    <div className="flex flex-col gap-2">
      {videos.map((video) => (
        <div key={video}>
          <iframe
            className="w-full md:w-[560px]"
            height={315}
            src={video}
            title="YouTube video player"
            frameborder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          />
        </div>
      ))}
    </div>
  );
};

export default France;
