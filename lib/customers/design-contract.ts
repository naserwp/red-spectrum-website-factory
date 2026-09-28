import { z } from 'zod';
// Data only: no generated HTML, CSS, JavaScript, URLs or executable expressions.
export const designText=z.string().trim().min(1).max(1800).refine(s=>!/[<>]|javascript:|data:|https?:\/\/|API_KEY|DATABASE_URL|SESSION_SECRET/i.test(s),'Plain public text only');
export const sectionSchema=z.object({kind:z.enum(['split','statement','image','steps','columns','contact']),eyebrow:designText,heading:designText,body:designText,image:z.number().int().min(0).max(11),reverse:z.boolean()}).strict();
export const designSchema=z.object({
 version:z.literal('2.0'),hero:z.enum(['editorial','panorama','journal']),navigation:z.enum(['balanced','compact']),typography:z.enum(['editorial','modern','classic']),spacing:z.enum(['generous','compact']),palette:z.enum(['forest','ink','clay']),logo:z.enum(['open-frame','interlock','ligature']),
 pages:z.object({home:z.array(sectionSchema).min(5).max(9),services:z.array(sectionSchema).min(2).max(5),about:z.array(sectionSchema).min(2).max(5),contact:z.array(sectionSchema).min(1).max(3),privacy:z.array(sectionSchema).min(1).max(3)}).strict(),
 imageDirection:designText,brandNotes:designText,
}).strict();
export type SiteDesign=z.infer<typeof designSchema>;
