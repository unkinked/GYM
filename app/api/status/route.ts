import {env} from "cloudflare:workers";
import {identity,json,errorResponse,db} from "@/lib/server";
import {bogotaDay} from "@/lib/domain";
export async function GET(){try{const owner=await identity();const usage=await db().prepare("SELECT attempts FROM ai_usage WHERE owner=? AND day=?").bind(owner,bogotaDay()).first<{attempts:number}>();return json({configured:!!env.GEMINI_API_KEY,model:"gemini-3.8-flash",attempts:usage?.attempts??0,dailyLimit:5});}catch(e){return errorResponse(e);}}
