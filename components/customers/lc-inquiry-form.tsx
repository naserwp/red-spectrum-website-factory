"use client";
import {useRef, useState} from "react";
import Link from "next/link";

export function LcInquiryForm(){
  const [message,setMessage]=useState("");
  const [state,setState]=useState<"idle"|"sending"|"success"|"error"|"saved">("idle");
  const inFlight=useRef(false);
  async function submit(event:React.FormEvent<HTMLFormElement>){
    event.preventDefault();
    if(inFlight.current || state==="success" || state==="saved")return;
    const data=new FormData(event.currentTarget);
    data.set("service",String(data.get("investmentInterest") || ""));
    inFlight.current=true;setState("sending");setMessage("");
    try{
      const response=await fetch("/api/leads/lc-real-estate",{method:"POST",body:data,signal:AbortSignal.timeout(20000)});
      const payload:unknown=await response.json();
      if(!payload || typeof payload!=="object" || !("message" in payload) || typeof payload.message!=="string")throw new Error("Unexpected response");
      const result=payload as {message:string;ok?:boolean;saved?:boolean};
      if(response.ok && result.ok===true){
        setState("success");setMessage(result.message);
      }else{
        setState(result.saved===true?"saved":"error");
        setMessage(typeof result.message==="string"?result.message:"We could not accept your inquiry. Please try again or contact Larry directly.");
      }
    }catch{
      setState("error");setMessage("We could not confirm submission. Your entries are still here. Retry once or contact Larry directly if urgent.");
    }finally{inFlight.current=false;}
  }
  return <form className="lc-form" onSubmit={submit} aria-busy={state==="sending"}>
    <p className="lc-notice">Do not enter sensitive financial information. If submission is unavailable, call or email Larry directly.</p>
    <div className="lc-form-grid">
      <label>Name<input name="name" autoComplete="name" minLength={2} maxLength={100} required/></label>
      <label>Email<input name="email" type="email" autoComplete="email" maxLength={200} required/></label>
      <label>Phone<input name="phone" type="tel" autoComplete="tel" minLength={7} maxLength={40} required/></label>
      <label>Investment interest<select name="investmentInterest" required defaultValue=""><option value="" disabled>Select an interest</option><option>Property opportunities</option><option>Portfolio support</option><option>General consultation</option><option>Other / not sure</option></select></label>
      <label>Budget range<select name="budgetRange" defaultValue="Prefer to discuss"><option>Prefer to discuss</option><option>Under $100,000</option><option>$100,000–$500,000</option><option>$500,000–$1 million</option><option>Over $1 million</option></select></label>
      <label>Preferred property type<select name="propertyType" defaultValue="Exploring options"><option>Exploring options</option><option>Residential</option><option>Commercial</option><option>Mixed-use</option></select></label>
    </div>
    <label>Message<textarea name="message" rows={5} minLength={5} maxLength={3000} placeholder="Share your goals and preferred callback time. No bank, card or account details." required/></label>
    <div hidden aria-hidden="true"><label>Leave empty<input name="botcheck" tabIndex={-1} autoComplete="off"/></label></div>
    <label className="lc-consent"><input name="consent" type="checkbox" required/><span>I agree to be contacted about my website or real estate inquiry. This does not authorize payment or credit approval.</span></label>
    <p className="lc-small">Read our <Link href="/lc-real-estate/privacy">Privacy notice</Link>. Submitting does not authorize payment or guarantee an investment, financing or appointment.</p>
    <button className="lc-button" type="submit" disabled={["sending","success","saved"].includes(state)}>{state==="sending"?"Submitting…":state==="success"?"Inquiry accepted":state==="saved"?"Inquiry saved — notification pending":"Submit inquiry"} <span aria-hidden="true">↗</span></button>
    <p role={state==="error"||state==="saved"?"alert":"status"} aria-live="polite">{message}</p>
  </form>;
}
