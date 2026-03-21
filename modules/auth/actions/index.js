"use server";

import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const onBoardUser = async () => {
    try {
        const user = await currentUser();

        if (!user) return null;

        const existingUser = await db.user.findUnique({
            where: {
                clerkId: user.id,
            },
        });

        if (existingUser) return existingUser;

        const email = user.primaryEmailAddress?.emailAddress || `${user.id}@clerk.local`;

        return await db.user.create({
            data: {
                clerkId: user.id,
                email,
                firstName: user.firstName,
                lastName: user.lastName,
                imageUrl: user.imageUrl,
            },
        });
    } catch (error) {
        console.log("Onboarding error:", error);
        return null;
    }
};

export const currentUserRole = async () => {

    try{

        const user = await currentUser();

        if(!user) return null;

        const dbUser = await db.user.findUnique({
            where:{
                clerkId:user.id
            },
            select:{
                role:true
            }
        });

        return dbUser?.role || "USER";

    }
    catch(error){
        console.log("Role fetch error:", error);
        return null;
    }

};