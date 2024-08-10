// "use client";

// import { DialogUploaderDemo } from "@/components/DialogUploader";
// import React from "react";

// const Page = () => {
//   return (
//     <div className="flex flex-col justify-center items-center h-screen">
//       <DialogUploaderDemo />

//       <div className="mt-4 flex flex-col items-center justify-center"></div>
//     </div>
//   );
// };

// export default Page;

"use client";

import React from "react";
import { motion } from "framer-motion";
import { DialogUploaderDemo } from "@/components/DialogUploader";
import { Button } from "@/components/ui/button";
import Link from "next/link";

type Props = {};

const Page: React.FC<Props> = (props: Props) => {
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  const buttonVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.5, delay: 0.2 } },
  };

  const imageVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.5, delay: 0.2 },
    },
  };

  return (
    <motion.div
      className="flex flex-col items-center lg:flex-row lg:justify-between lg:max-h-[80vh] lg:mt-16 px-4 md:px-8 lg:px-16 mt-10"
      initial="hidden"
      animate="visible"
      variants={containerVariants}
    >
      <div className="lg:w-1/2 lg:flex lg:flex-col lg:items-start lg:justify-center lg:pr-8 mb-8 lg:mb-0">
        <h1 className="text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
          Welcome to
          <span className="pl-3 bg-gradient-to-r from-[#EE9CA7]  to-[#FFDDE1] bg-clip-text text-transparent">
            Image Processor
          </span>
        </h1>
        <p className="text-base lg:text-lg mb-6 lg:mb-10 font-normal">
          Upload an image and get it processed in real-time using the power of
          Image Processor.
        </p>
        <Link href="/Dashboard">
          <Button className="mt-4">Start Processing</Button>
        </Link>
      </div>
      <div className="lg:w-1/2">
        <motion.img
          src="https://images.unsplash.com/photo-1535982330050-f1c2fb79ff78?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8Y29sbGVnZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=1400&q=60"
          alt="College"
          className="w-full h-auto rounded-lg"
          variants={imageVariants}
        />
      </div>
    </motion.div>
  );
};

export default Page;
