"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Terminal } from "lucide-react";
import ShinyButton from "@/components/ui/shiny-button";


type Props = {};

const Page: React.FC<Props> = (props: Props) => {
  return (
    <div
      className="min-h-screen flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8"
    >
      <div className="mx-4 mb-20 hover:shadow-md transition-all duration-300 ease-in-out">
        <Alert>
          <Terminal className="h-4 w-4" />
          <AlertTitle>Heads up!</AlertTitle>
          <AlertDescription>
            Just a Simple Image Processing stuff made by
            <span className="pl-1 text-orange-500">
              <Link href={"https://x.com/Saurav_Pant_"}
                target="_blank"
              >
                @Saurav-Pant
              </Link>
            </span>
          </AlertDescription>
        </Alert>
      </div>
      
      <ShinyButton text="Play with your Image" className="font-bold" />

      <h1 className="max-w-4xl text-5xl md:text-6xl lg:text-6xl font-bold mb-4 sm:mb-5 text-center mt-3">
        Welcome to
        <span className="text-orange-500 block sm:inline sm:ml-3">
          Image Processor
        </span>
      </h1>
      <p className="text-sm sm:text-base lg:text-lg mb-6 font-normal text-center max-w-2xl">
        Upload an image and get it processed in real-time
      </p>
      <Link href="/Dashboard">
        <Button className="mt-2">Start Processing</Button>
      </Link>
    </div>
  );
};

export default Page;
