import React from "react";

export default function Example() {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&display=swap');
        * { font-family: 'Poppins', sans-serif; }
      `}</style>

      {/* Header */}
      <div className="mx-auto max-w-5xl  dark:text-white px-6 pt-16 text-center">
        <h2 className="text-balance dark:text-white text-3xl font-semibold text-gray-900 md:text-4xl">
          Join Our Community
        </h2>
        <p className="mt-3 dark-text-white text-sm text-gray-600 md:text-base">
          Meet readers, share ideas, and grow your skills together.
        </p>
      </div>

      {/* Card (background removed) */}
      <div className="max-w-5xl  md:w-full mx-2 md:mx-auto mt-10 flex flex-col items-center justify-center text-center rounded-2xl p-10 dark:border-none border border-zinc-200 bg-white dark:bg-gray-800 dark:text-white text-zinc-900">
        <div className="flex flex-wrap items-center justify-center p-1 rounded-full bg-zinc-50 dark:bg-gray-800 dark:text-white border border-zinc-200 text-sm">
          <div className="flex items-center">
            <img
              className="size-6 md:size-7 rounded-full border-2 border-white"
              src="testomial/xasan.jpg"
              alt="userImage1"
            />
            <img
              className="size-6 md:size-7 rounded-full border-2 border-white -translate-x-2"
              src="testomial/ciise.jpg"
              alt="userImage2"
            />
            <img
              className="size-6 md:size-7 rounded-full border-2 border-white -translate-x-4"
              src="testomial/nasra.jpg"
              alt="userImage3"
            />
          </div>

          <p className="-translate-x-2 font-medium dark:text-white text-zinc-700">
            Join community of 200+ readers
          </p>
        </div>

        <h1 className="text-xl dark:text-white md:text-xl md:leading-[60px] font-semibold max-w-xl mt-5">
          Connect, Share, and Grow with Fellow Book Lovers
        </h1>

        <button
          className="px-8 py-3 text-white bg-orange-600 hover:bg-orange-700 transition-all rounded-full uppercase text-sm mt-8"
          type="button"
          onClick={() => window.open("https://discord.com/", "_blank")}
        >
          Join Discord
        </button>
      </div>
    </>
  );
}