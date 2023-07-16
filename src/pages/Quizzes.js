import React from "react";

const quizData = [
  {
    url: "https://www.playbuzz.com/katesf13/how-single-are-you",
    title: "How Single Are You?",
    description: "Are you single? Or are you single?",
    thumbnail:
      "https://img.playbuzz.com/image/upload/ar_1.5,c_pad,f_jpg,b_auto/q_auto:good,f_auto,fl_lossy,w_640,c_limit,dpr_2/cdn/9c969ad6-79e5-4145-87a3-ac7107137b12/1bc7fe64-b9eb-484f-8471-a1d5ea03a167_560_420.jpg",
  },
  {
    url: "https://www.playbuzz.com/katesf13/which-friend-are-you",
    title: "Which Friend Are You?",
    description:
      "Are you having an identity crisis? Figure out which friend you are.",
    thumbnail:
      "https://img.playbuzz.com/image/upload/ar_1.5,c_pad,f_jpg,b_auto/q_auto:good,f_auto,fl_lossy,w_640,c_limit,dpr_2/cdn/10aac34a-f850-4993-81a8-de4af1328d34/cc7018c2-0aba-4e1e-8735-2f7b707f533f_560_420.jpg",
  },
  {
    url: "https://www.playbuzz.com/katesf13/stevenzses",
    title: "Stevenz'ses",
    description: "For those who want to be more like us",
    thumbnail:
      "https://img.playbuzz.com/image/upload/ar_1.5,c_pad,f_jpg,b_auto/q_auto:good,f_auto,fl_lossy,w_640,c_limit,dpr_2/cdn/9bf942f5-f4d8-4ba7-ad0e-e262033ce3f9/b9b28a89-6e7f-4835-9e2d-30b2e0a37504_560_420.jpg",
  },
  {
    url: "https://www.playbuzz.com/katesf13/hi-im-kate",
    title: "Hi, I'm Kate",
    description: "Are you in fact, Kate?",
    thumbnail:
      "https://img.playbuzz.com/image/upload/ar_1.5,c_pad,f_jpg,b_auto/q_auto:good,f_auto,fl_lossy,w_640,c_limit,dpr_2/cdn/115ed784-0822-4bda-8b34-6ef040f7b078/3f402775-5704-4a83-84eb-d73137082249_560_420.jpg",
  },
];

const Quizzes = () => {
  return (
    <div className="flex flex-wrap gap-2">
      {quizData.map((quiz) => (
        <div key={quiz.url}>
          <a href={quiz.url} target="_blank" rel="noreferrer">
            <div className="relative">
              <img className="w-full" src={quiz.thumbnail} alt={quiz.title} />
              <div className="absolute top-0 left-0 p-2 text-white bg-indigo-400 bg-opacity-70">
                <h3 className="text-xl font-extrabold">{quiz.title}</h3>
                <div>{quiz?.description}</div>
              </div>
            </div>
          </a>
        </div>
      ))}
    </div>
  );
};

export default Quizzes;
