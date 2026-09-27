"use client";
import {useState} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type {PreviewCard} from '@/lib/webfactory/preview-catalog';
export function CustomerPreviews({cards,admin,unavailable}:{cards:PreviewCard[];admin:boolean;unavailable:boolean}){
  const [search,setSearch]=useState(''),[filter,setFilter]=useState('All');
  const visible=cards.filter(card=>(card.name+' '+(card.slug || '')).toLowerCase().includes(search.toLowerCase())&&(filter==='All'||filter==='Building'&&['building','build approved','changes requested'].includes(card.status)||filter==='Preview Ready'&&card.status==='preview ready'||filter==='Approved'&&card.status==='approved'));
  return <section className="wf-wrap wf-section wf-preview-section" aria-labelledby="customer-previews-heading">
    <div className="wf-section-heading"><div><p className="wf-eyebrow">From request to review</p><h2 id="customer-previews-heading">Customer previews</h2><p className="wf-lead">Individual businesses. Distinctive websites. Follow the work as previews become ready.</p></div><span className="wf-preview-count">{cards.length} projects</span></div>
    <div className="wf-preview-toolbar"><label className="wf-field">Search business or slug<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Find a customer preview"/></label><div className="wf-preview-filters" role="group" aria-label="Filter customer previews">{['All','Building','Preview Ready','Approved'].map(label=><button type="button" key={label} aria-pressed={filter===label} onClick={()=>setFilter(label)}>{label}</button>)}</div></div>
    {unavailable&&<p role="status">Some in-progress records are temporarily unavailable. Registered website previews remain below.{admin?' Check request storage availability in Admin.':''}</p>}
    <p className="wf-preview-results" role="status">{visible.length} matching {visible.length===1?'project':'projects'}</p>
    <div className="wf-preview-grid">{visible.map(card=><article className="wf-preview-card" key={card.key} data-preview-slug={card.slug || ''}>
      <div className="wf-preview-image">{card.image?<Image src={card.image} alt="" fill sizes="(max-width:700px) 100vw, (max-width:1050px) 50vw, 33vw" className="object-cover"/>:<div className="wf-preview-placeholder" aria-hidden="true"><span>RS / WEBFACTORY</span><strong>{card.name.slice(0,2).toUpperCase()}</strong><small>Website in progress</small></div>}<span className={'wf-preview-status status-'+card.status.replaceAll(' ','-')}>{card.status}</span></div>
      <div className="wf-preview-body"><small>{card.industry || 'Business website'}</small><h3>{card.name}</h3><p>{card.description}</p><code>{card.slug || 'Slug awaiting confirmation'}</code>
        {card.href?<Link className="wf-button secondary" href={card.href}>Preview website ↗</Link>:<span className="wf-preview-pending">{['preview ready','approved','changes requested'].includes(card.status)?'Preview not ready':'Build pending'}</span>}
        {admin&&card.admin&&<details className="wf-preview-admin"><summary>Admin project details</summary><dl><dt>Request status</dt><dd>{card.admin.requestStatus}</dd><dt>Slug</dt><dd>{card.slug || 'Not confirmed'}</dd><dt>Last updated (UTC)</dt><dd>{card.admin.updatedAt}</dd><dt>Action log entries</dt><dd>{card.admin.actionCount}</dd></dl><Link href={card.admin.requestHref}>Open admin request →</Link></details>}
      </div></article>)}</div>
    {!visible.length&&<div className="wf-preview-empty"><h3>No matching previews</h3><p>Try another business name or choose All. New projects appear after a slug or preview address is saved.</p><button className="wf-button secondary" onClick={()=>{setSearch('');setFilter('All');}}>Clear filters</button></div>}
  </section>;
}
