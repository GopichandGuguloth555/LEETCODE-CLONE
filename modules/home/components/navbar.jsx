"use client";

import { Button } from "@/components/ui/button";
import { ModeToggle } from "@/components/ui/mode-toggle";
import {
  useAuth,
  SignInButton,
  SignUpButton,
  UserButton,
} from "@clerk/nextjs";
import { UserRole } from "@prisma/client";
import Image from "next/image";
import Link from "next/link";
import React from "react";

const Navbar = ({ userRole }) => {
  const { isSignedIn } = useAuth();

  return (
    <nav className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-5xl px-4">
      
      <div
        className="bg-white/80 backdrop-blur-md border border-zinc-200/80
      dark:bg-zinc-950/85 dark:border-zinc-700/80 rounded-2xl shadow-lg
      shadow-zinc-900/10 dark:shadow-black/40 transition-all duration-200
      hover:bg-white/90 dark:hover:bg-zinc-950/95"
      >

        <div className="px-6 py-4 flex justify-between items-center">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="TreeBio"
              width={42}
              height={42}
            />

            <span className="font-bold text-2xl tracking-widest text-amber-300">
              LeetCode
            </span>
          </Link>

          {/* Middle Links */}
          <div className="flex flex-row items-center justify-center gap-x-4">
            
            <Link
              href="/problems"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-200
              hover:text-amber-600 dark:hover:text-amber-400"
            >
              Problems
            </Link>

            <Link
              href="/about"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-200
              hover:text-amber-600 dark:hover:text-amber-400"
            >
              About
            </Link>

            <Link
              href="/profile"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-200
              hover:text-amber-600 dark:hover:text-amber-400"
            >
              Profile
            </Link>

          </div>

          {/* Right Section */}
          <div className="flex items-center gap-4">

            <ModeToggle />

            {isSignedIn ? (
              <>
                {userRole === UserRole.ADMIN && (
                  <Link href="/create-problem">
                    <Button variant="outline">
                      Create Problem
                    </Button>
                  </Link>
                )}
                <UserButton />
              </>
            ) : (

              <div className="flex items-center gap-2">

                <SignInButton>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-sm font-medium 
                    hover:bg-white/20 dark:hover:bg-white/10"
                  >
                    Sign In
                  </Button>
                </SignInButton>

                <SignUpButton>
                  <Button
                    size="sm"
                    className="text-sm font-medium 
                    bg-amber-400 hover:bg-amber-500 text-white"
                  >
                    Sign Up
                  </Button>
                </SignUpButton>

              </div>

            )}

          </div>

        </div>

      </div>

    </nav>
  );
};

export default Navbar;