import React from "react";

const videos = [
  {
    id: 1,
    src: "https://www.youtube.com/embed/mKKIpWlvRZs",
  },
  {
    id: 2,
    src: "https://www.youtube.com/embed/CIinW8nGjF0",
  },
];

const France = () => {
  return (
    <div className="flex flex-col gap-2">
      {videos.map((video) => (
        <div key={video.id}>
          <iframe
            className="w-full md:w-[560px]"
            height={315}
            src={video.src}
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
