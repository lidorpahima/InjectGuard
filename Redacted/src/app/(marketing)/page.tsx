import { DemoGuardrail } from "@/components/demo-guardrail";
import { AnimationContainer, MaxWidthWrapper, PricingCards } from "@/components";
import { AndMoreExpandable } from "@/components/ui/and-more-expandable";
import { BentoCard, BentoGrid, CARDS } from "@/components/ui/bento-grid";
import { TypewriterText } from "@/components/ui/typewriter-text";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { LampContainer } from "@/components/ui/lamp";
import MagicBadge from "@/components/ui/magic-badge";
import MagicCard from "@/components/ui/magic-card";
import { COMPANIES, PROCESS } from "@/utils";
import { REVIEWS } from "@/utils/constants/misc";
import { currentUser } from "@clerk/nextjs/server";
import { ArrowRightIcon, CreditCardIcon, StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const HomePage = async () => {

    const user = await currentUser();

    return (
        <div className="overflow-x-hidden scrollbar-hide size-full">
            {/* Hero Section */}
            <MaxWidthWrapper>
                <div className="flex flex-col items-center justify-center w-full text-center bg-gradient-to-t from-background">
                    <AnimationContainer className="flex flex-col items-center justify-center w-full text-center">
                        <button className="group relative grid overflow-hidden rounded-full px-4 py-1 shadow-[0_1000px_0_0_hsl(0_0%_20%)_inset] transition-colors duration-200">
                            <span>
                                <span className="spark mask-gradient absolute inset-0 h-[100%] w-[100%] animate-flip overflow-hidden rounded-full [mask:linear-gradient(white,_transparent_50%)] before:absolute before:aspect-square before:w-[200%] before:rotate-[-90deg] before:animate-rotate before:bg-[conic-gradient(from_0deg,transparent_0_340deg,white_360deg)] before:content-[''] before:[inset:0_auto_auto_50%] before:[translate:-50%_-15%]" />
                            </span>
                            <span className="backdrop absolute inset-[1px] rounded-full bg-neutral-950 transition-colors duration-200 group-hover:bg-neutral-900" />
                            <span className="h-full w-full blur-md absolute bottom-0 inset-x-0 bg-gradient-to-tr from-primary/20"></span>
                            <span className="z-10 py-0.5 text-sm text-neutral-100 flex items-center justify-center gap-1">
                                ✨ Keep your AI conversations ████████
                                <ArrowRightIcon className="ml-1 size-3 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                            </span>
                        </button>
                        <h1 className="text-foreground text-center py-6 text-5xl font-medium tracking-normal text-balance sm:text-6xl md:text-7xl lg:text-8xl !leading-[1.15] w-full font-heading">
                            Secure your LLM traffic<br />{" "}
                            <span className="text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 bg-clip-text inline-block min-w-[2ch]">
                                <TypewriterText
                                    words={["Jailbreak-proof", "PII-safe", "Policy-first"]}
                                    cursorClassName="bg-fuchsia-500"
                                />
                            </span>
                        </h1>
                        <p className="mb-12 text-lg tracking-tight text-muted-foreground md:text-xl text-balance">
                            One gateway between your app and OpenAI, Gemini, Claude and more. Every request is scanned for threats before it reaches the model.
                            <br className="hidden md:block" />
                            <span className="hidden md:block">Connect your API key, get a gateway key, and we handle the rest.</span>
                        </p>
                        <div className="flex items-center justify-center whitespace-nowrap gap-4 z-50">
                            <Button asChild>
                                <Link href={user ? "/dashboard" : "/auth/sign-in"} className="flex items-center">
                                    Get started for free
                                    <ArrowRightIcon className="w-4 h-4 ml-2" />
                                </Link>
                            </Button>
                        </div>
                    </AnimationContainer>

                    <AnimationContainer delay={0.2} className="relative pt-16 pb-12 md:py-24 px-2 bg-transparent w-full max-w-3xl mx-auto">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3/4 h-2/3 bg-violet-500/10 blur-[6rem] rounded-full pointer-events-none" />
                        <div className="relative z-10">
                            <DemoGuardrail />
                        </div>
                    </AnimationContainer>
                </div>
            </MaxWidthWrapper >

            {/* Companies Section */}
            <MaxWidthWrapper>
                <AnimationContainer delay={0.4}>
                    <div className="py-14">
                        <div className="mx-auto px-4 md:px-8">
                            <h2 className="text-center text-sm font-medium font-heading text-neutral-400 uppercase">
                            Works with industry-leading AI providers
                            </h2>
                            <div className="mt-8">
                                <ul className="flex flex-wrap items-center gap-x-6 gap-y-6 md:gap-x-16 justify-center">
                                    {COMPANIES.map((company) => (
                                        <li key={company.name} className="flex items-center justify-center h-8 shrink-0">
                                            <Image
                                                src={company.logo}
                                                alt={company.name}
                                                width={120}
                                                height={32}
                                                quality={100}
                                                className="h-8 w-auto max-w-[120px] object-contain object-center brightness-0 invert"
                                            />
                                        </li>
                                    ))}
                                </ul>
                                <div className="mt-6 flex justify-center">
                                    <AndMoreExpandable />
                                </div>
                            </div>
                        </div>
                    </div>
                </AnimationContainer>
            </MaxWidthWrapper>

            {/* Features Section */}
            <MaxWidthWrapper className="pt-10">
                <AnimationContainer delay={0.1}>
                    <div className="flex flex-col w-full items-center lg:items-center justify-center py-8">
                        <MagicBadge title="Features" />
                        <h2 className="text-center lg:text-center text-3xl md:text-5xl !leading-[1.1] font-medium font-heading text-foreground mt-6">
                            Four reasons enterprises trust us
                        </h2>
                        <p className="mt-4 text-center lg:text-center text-lg text-muted-foreground max-w-lg">
                            We don’t just proxy requests—we protect data, enforce your rules, speed up answers, and block attacks before they reach the LLM.
                        </p>
                    </div>
                </AnimationContainer>
                <AnimationContainer delay={0.2}>
                    <BentoGrid className="py-8">
                        {CARDS.map((feature, idx) => (
                            <BentoCard key={idx} {...feature} />
                        ))}
                    </BentoGrid>
                </AnimationContainer>
            </MaxWidthWrapper>

            {/* Process Section */}
            <MaxWidthWrapper className="py-10">
                <AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center lg:items-center justify-center w-full py-8 max-w-xl mx-auto">
                        <MagicBadge title="The Process" />
                        <h2 className="text-center lg:text-center text-3xl md:text-5xl !leading-[1.1] font-medium font-heading text-foreground mt-6">
                            Secure your LLM traffic in 3 steps
                        </h2>
                        <p className="mt-4 text-center lg:text-center text-lg text-muted-foreground max-w-lg">
                            Route requests through the gateway, enforce policies and block threats, then get fast and secure responses—all in one place.
                        </p>
                    </div>
                </AnimationContainer>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full py-8 gap-4 md:gap-8">
                    {PROCESS.map((process, id) => (
                        <AnimationContainer delay={0.2 * id} key={id}>
                            <MagicCard className="group md:py-8">
                                <div className="flex flex-col items-start justify-center w-full">
                                    <process.icon strokeWidth={1.5} className="w-10 h-10 text-foreground" />
                                    <div className="flex flex-col relative items-start">
                                        <span className="absolute -top-6 right-0 border-2 border-border text-foreground font-medium text-2xl rounded-full w-12 h-12 flex items-center justify-center pt-0.5">
                                            {id + 1}
                                        </span>
                                        <h3 className="text-base mt-6 font-medium text-foreground">
                                            {process.title}
                                        </h3>
                                        <p className="mt-2 text-sm text-muted-foreground">
                                            {process.description}
                                        </p>
                                    </div>
                                </div>
                            </MagicCard>
                        </AnimationContainer>
                    ))}
                </div>
            </MaxWidthWrapper>

            {/* Pricing Section */}
            <MaxWidthWrapper className="py-10">
                <AnimationContainer delay={0.1}>
                    <div className="flex flex-col items-center lg:items-center justify-center w-full py-8 max-w-2xl mx-auto">
                        <MagicBadge title="Pricing" />
                        <h2 className="text-center lg:text-center text-3xl md:text-5xl !leading-[1.1] font-medium font-heading text-foreground mt-6">
                            Enterprise security at startup prices
                        </h2>
                        <p className="mt-4 text-center lg:text-center text-lg text-muted-foreground max-w-lg">
                            Freemium + usage-based. Start free, scale as you grow. Contact sales for paid plans—no credit card required to get started.
                        </p>
                    </div>
                </AnimationContainer>
                <AnimationContainer delay={0.2}>
                    <PricingCards />
                </AnimationContainer>
                <AnimationContainer delay={0.3}>
                    <div className="flex flex-wrap items-center justify-center gap-6 md:gap-10 mt-10 max-w-3xl mx-auto w-full">
                        <div className="flex items-center gap-2">
                            <CreditCardIcon className="w-5 h-5 text-foreground shrink-0" />
                            <span className="text-muted-foreground text-sm">No credit card required</span>
                        </div>
                        <span className="text-muted-foreground/60">•</span>
                        <span className="text-muted-foreground text-sm">Contact sales for Startup, Professional & Enterprise</span>
                        <span className="text-muted-foreground/60">•</span>
                        <span className="text-muted-foreground text-sm">20% off with annual billing</span>
                    </div>
                </AnimationContainer>
                {/* Market comparison: why our pricing wins */}
                <AnimationContainer delay={0.35}>
                    <div className="mt-14 max-w-3xl mx-auto">
                        <p className="text-center text-sm font-medium text-muted-foreground mb-4">How we compare</p>
                        <div className="overflow-x-auto rounded-lg border border-border">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border bg-muted/30">
                                        <th className="text-left py-3 px-4 font-medium">Provider</th>
                                        <th className="text-left py-3 px-4 font-medium">Free tier</th>
                                        <th className="text-left py-3 px-4 font-medium">Paid from</th>
                                        <th className="text-left py-3 px-4 font-medium">Enterprise</th>
                                    </tr>
                                </thead>
                                <tbody className="text-muted-foreground">
                                    <tr className="border-b border-border/50">
                                        <td className="py-3 px-4">Lakera</td>
                                        <td className="py-3 px-4">Limited</td>
                                        <td className="py-3 px-4">$99/mo</td>
                                        <td className="py-3 px-4">Custom ($500+/mo)</td>
                                    </tr>
                                    <tr className="border-b border-border/50">
                                        <td className="py-3 px-4">Cloudflare AI Gateway</td>
                                        <td className="py-3 px-4">Yes</td>
                                        <td className="py-3 px-4">Free + infra</td>
                                        <td className="py-3 px-4">Custom</td>
                                    </tr>
                                    <tr className="border-b border-border/50">
                                        <td className="py-3 px-4">Portkey</td>
                                        <td className="py-3 px-4">Trial</td>
                                        <td className="py-3 px-4">$49/mo</td>
                                        <td className="py-3 px-4">Custom</td>
                                    </tr>
                                    <tr className="bg-primary/5">
                                        <td className="py-3 px-4 font-medium text-foreground">Redacted</td>
                                        <td className="py-3 px-4">1K req/mo</td>
                                        <td className="py-3 px-4 font-medium text-foreground">$49/mo</td>
                                        <td className="py-3 px-4 font-medium text-foreground">$1K–5K/mo</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </AnimationContainer>
            </MaxWidthWrapper>


            {/* CTA Section */}
            <MaxWidthWrapper className="mt-20 max-w-[100vw] overflow-x-hidden scrollbar-hide">
                <AnimationContainer delay={0.1}>
                    <LampContainer>
                        <div className="flex flex-col items-center justify-center relative w-full text-center">
                            <h2 className="bg-gradient-to-b from-neutral-200 to-neutral-400 py-4 bg-clip-text text-center text-4xl md:text-7xl !leading-[1.15] font-medium font-heading tracking-tight text-transparent mt-8">
                                Secure AI for every team
                            </h2>
                            <p className="text-muted-foreground mt-6 max-w-md mx-auto">
                                Jailbreak & prompt-injection protection at the gateway.
                            </p>
                            <div className="mt-6">
                                <Button asChild>
                                    <Link href={user ? "/dashboard" : "/auth/sign-in"}>
                                        Get started for free
                                        <ArrowRightIcon className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </LampContainer>
                </AnimationContainer>
            </MaxWidthWrapper>

        </div>
    )
};

export default HomePage
