import "dotenv/config";
import { PrismaClient, NewsStatus } from "@prisma/client";
import { createHash } from "crypto";
const prisma = new PrismaClient();
const url = "https://example.com/news/sample-market-update";
const id = createHash("sha256").update(url).digest("hex");
async function main(){ await prisma.newsArticle.upsert({ where:{id}, update:{}, create:{ id, title:"Sample market update", description:"A sample article to verify the CMS and API.", content:"Replace or delete this article from the dashboard after installation.", imageUrl:null, source:"Sumar", sourceUrl:"https://example.com", url, publishedAt:new Date(), category:"FINANCE", status:NewsStatus.PUBLISHED }}); }
main().finally(()=>prisma.$disconnect());
