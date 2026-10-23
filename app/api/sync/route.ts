import { allRecords, body, errorResponse, identity, json, syncOperation } from "@/lib/server";
import { syncSchema, parseValue } from "@/lib/validation";
import type { Operation, SyncResult } from "@/lib/types";
export async function GET(){try{const owner=await identity();return json({records:await allRecords(owner)});}catch(e){return errorResponse(e);}}
export async function POST(request:Request){try{const owner=await identity(request),input=syncSchema.parse(await body(request));const results:SyncResult[]=[];const blocked=new Set<string>();for(const raw of input.operations){const key=raw.kind+":"+raw.entityId;if(blocked.has(key))continue;const value=parseValue(raw.kind,raw.value);const result=await syncOperation(owner,{...raw,value} as Operation);results.push(result);if(result.status==="conflict")blocked.add(key);}return json({results,records:await allRecords(owner)});}catch(e){return errorResponse(e);}}
