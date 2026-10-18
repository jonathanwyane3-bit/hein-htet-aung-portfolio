/**
 * Bundled Static Image Assets for Netlify & Public Production
 * Clean static paths pointing to public/images/
 */

export type BundledImagesRegistry = Record<string, string>;

export const BUNDLED_IMAGES: BundledImagesRegistry = {
  "evidence_shell_director": "/images/evidence_shell.jpg",
  "evidence_ib_head": "/images/evidence_ib_head.jpg",
  "evidence_stamford_head": "/images/evidence_ib_head.jpg",
  "hero_suit_portrait": "/images/hero_portrait_raw.png",
  "hero_suit_cutout": "/images/hero_suit_cutout.png",
  "cert_unilever": "/images/cert_unilever.jpg",
  "cert_thekap": "/images/cert_thekap.jpg",
  "lead_photo_redcross": "/images/lead_photo_redcross.jpg",
  "lead_photo_enervon": "/images/lead_photo_enervon.jpg",
  "lead_photo_council": "/images/lead_photo_council.jpg",
  "lead_photo_hypen": "/images/lead_photo_hypen.png",
  "cert_nlp": "/images/cert_nlp.jpg",
  "cert_adcamp": "/images/cert_adcamp.jpg",
  "hero_arms_crossed_portrait": "/images/hero_portrait_raw.png",
  "hero_arms_crossed_cutout": "/images/hero_portrait_raw.png",
  "exp_photo_aim": "/images/exp_photo_aim.jpg",
  "cert_gee": "/images/cert_gee.jpg",
  "cert_hypen": "/images/cert_hypen.png",
  "cert_simplilearn": "/images/cert_simplilearn.jpg",
  "cert_yaymal_adv": "/images/cert_yaymal_adv.jpg",
  "cert_yaymal_basic": "/images/cert_yaymal_basic.jpg",
  "evidence_shell": "/images/evidence_shell.jpg",
  "exp_photo_helix": "/images/exp_photo_helix.png",
  "exp_photo_tutor": "/images/exp_photo_tutor.png",
  "hero_portrait_raw": "/images/hero_portrait_raw.png",
  "hero_portrait": "/images/hero_portrait_raw.png",
  "lead_photo_tt_president": "/images/lead_photo_tt_president.png",
  "lead_photo_gee": "/images/lead_photo_gee.jpg"
};

export function getBundledImage(key: string): string | undefined {
  return BUNDLED_IMAGES[key];
}
