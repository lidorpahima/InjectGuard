"use client";

import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn, PLANS } from "@/utils";
import { motion } from "framer-motion";
import { CheckCircleIcon } from "lucide-react";
import Link from "next/link";
import { useState } from 'react';

type Tab = "monthly" | "yearly";

const PricingCards = () => {

    const MotionTabTrigger = motion(TabsTrigger);

    const [activeTab, setActiveTab] = useState<Tab>("monthly");

    return (
        <Tabs defaultValue="monthly" className="w-full flex flex-col items-center justify-center">
            <TabsList>
                <MotionTabTrigger
                    value="monthly"
                    onClick={() => setActiveTab("monthly")}
                    className="relative"
                >
                    {activeTab === "monthly" && (
                        <motion.div
                            layoutId="active-tab-indicator"
                            transition={{
                                type: "spring",
                                bounce: 0.5,
                            }}
                            className="absolute top-0 left-0 w-full h-full bg-background shadow-sm rounded-md z-10"
                        />
                    )}
                    <span className="z-20">
                        Monthly
                    </span>
                </MotionTabTrigger>
                <MotionTabTrigger
                    value="yearly"
                    onClick={() => setActiveTab("yearly")}
                    className="relative"
                >
                    {activeTab === "yearly" && (
                        <motion.div
                            layoutId="active-tab-indicator"
                            transition={{
                                type: "spring",
                                bounce: 0.5,
                            }}
                            className="absolute top-0 left-0 w-full h-full bg-background shadow-sm rounded-md z-10"
                        />
                    )}
                    <span className="z-20">
                        Yearly
                    </span>
                </MotionTabTrigger>
            </TabsList>

            <TabsContent value="monthly" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full md:gap-6 flex-wrap max-w-6xl mx-auto pt-6">
                {PLANS.map((plan) => (
                    <Card
                        key={plan.name}
                        className={cn(
                            "flex flex-col w-full border-border rounded-xl",
                            plan.name === "Startup" && "border-2 border-purple-500"
                        )}
                    >
                        <CardHeader className={cn(
                            "border-b border-border",
                            plan.name === "Startup" ? "bg-purple-500/[0.07]" : "bg-foreground/[0.03]"
                        )}>
                            <CardTitle className={cn(plan.name !== "Startup" && "text-muted-foreground", "text-lg font-medium")}>
                                {plan.name}
                            </CardTitle>
                            <CardDescription>
                                {plan.info}
                            </CardDescription>
                            <h5 className="text-3xl font-semibold">
                                {"customPrice" in plan && plan.customPrice
                                    ? plan.customPrice
                                    : `$${plan.price.monthly}`}
                                <span className="text-base text-muted-foreground font-normal">
                                    {plan.name === "Free" ? " /month" : "customPrice" in plan && plan.customPrice ? "" : " /month"}
                                </span>
                            </h5>
                            {"overage" in plan && plan.overage && (
                                <p className="text-xs text-muted-foreground mt-1">{plan.overage}</p>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {plan.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <CheckCircleIcon className="text-purple-500 w-4 h-4 shrink-0" />
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <p className={cn("text-sm", "tooltip" in feature && feature.tooltip && "border-b !border-dashed border-border cursor-pointer")}>
                                                    {feature.text}
                                                </p>
                                            </TooltipTrigger>
                                            {"tooltip" in feature && feature.tooltip && (
                                                <TooltipContent>
                                                    <p>{feature.tooltip}</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="w-full mt-auto">
                            <Link
                                href={plan.btn.href}
                                style={{ width: "100%" }}
                                className={buttonVariants({ className: plan.name === "Startup" && "bg-purple-500 hover:bg-purple-500/80 text-white" })}
                            >
                                {plan.btn.text}
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </TabsContent>
            <TabsContent value="yearly" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 w-full md:gap-6 flex-wrap max-w-6xl mx-auto pt-6">
                {PLANS.map((plan) => (
                    <Card
                        key={plan.name}
                        className={cn(
                            "flex flex-col w-full border-border rounded-xl",
                            plan.name === "Startup" && "border-2 border-purple-500"
                        )}
                    >
                        <CardHeader className={cn(
                            "border-b border-border",
                            plan.name === "Startup" ? "bg-purple-500/[0.07]" : "bg-foreground/[0.03]"
                        )}>
                            <CardTitle className={cn(plan.name !== "Startup" && "text-muted-foreground", "text-lg font-medium")}>
                                {plan.name}
                            </CardTitle>
                            <CardDescription>
                                {plan.info}
                            </CardDescription>
                            <h5 className="text-3xl font-semibold flex flex-wrap items-end gap-x-2">
                                {"customPrice" in plan && plan.customPrice
                                    ? plan.customPrice
                                    : `$${plan.price.yearly}`}
                                <span className="text-base text-muted-foreground font-normal">
                                    {plan.name === "Free" ? "/year" : "customPrice" in plan && plan.customPrice ? "" : "/year"}
                                </span>
                                {plan.name !== "Free" && !("customPrice" in plan && plan.customPrice) && (
                                    <motion.span
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: 10 }}
                                        transition={{ duration: 0.3, type: "spring", bounce: 0.25 }}
                                        className="px-2 py-0.5 rounded-md bg-purple-500 text-foreground text-sm font-medium"
                                    >
                                        Save 20%
                                    </motion.span>
                                )}
                            </h5>
                            {"overage" in plan && plan.overage && (
                                <p className="text-xs text-muted-foreground mt-1">{plan.overage}</p>
                            )}
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            {plan.features.map((feature, index) => (
                                <div key={index} className="flex items-center gap-2">
                                    <CheckCircleIcon className="text-purple-500 w-4 h-4 shrink-0" />
                                    <TooltipProvider>
                                        <Tooltip delayDuration={0}>
                                            <TooltipTrigger asChild>
                                                <p className={cn("text-sm", "tooltip" in feature && feature.tooltip && "border-b !border-dashed border-border cursor-pointer")}>
                                                    {feature.text}
                                                </p>
                                            </TooltipTrigger>
                                            {"tooltip" in feature && feature.tooltip && (
                                                <TooltipContent>
                                                    <p>{feature.tooltip}</p>
                                                </TooltipContent>
                                            )}
                                        </Tooltip>
                                    </TooltipProvider>
                                </div>
                            ))}
                        </CardContent>
                        <CardFooter className="w-full pt-4 mt-auto">
                            <Link
                                href={plan.btn.href}
                                style={{ width: "100%" }}
                                className={buttonVariants({ className: plan.name === "Startup" && "bg-purple-500 hover:bg-purple-500/80 text-white" })}
                            >
                                {plan.btn.text}
                            </Link>
                        </CardFooter>
                    </Card>
                ))}
            </TabsContent>
        </Tabs>
    )
};

export default PricingCards
