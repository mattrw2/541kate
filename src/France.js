import React from "react";

const videos = [
  {
    id: 1,
    embedCode: `<iframe width="560" height="315" src="https://www.youtube.com/embed/mKKIpWlvRZs" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`,
  },
  {
    id: 2,
    embedCode: `<iframe width="560" height="315" src="https://www.youtube.com/embed/CIinW8nGjF0" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen></iframe>`,
  },
];

const France = () => {
  return (
    <div className="flex flex-col gap-2">
      {videos.map((video) => (
        <div
          key={video.id}
          dangerouslySetInnerHTML={{ __html: video.embedCode }}
        />
      ))}
    </div>
  );
};

export default France;
