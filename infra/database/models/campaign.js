/**
 * Campaign Schema
 * This file describes the Campaing Model
 * 
 * @module CampaignSchema
 */

import mongoose from 'mongoose';

const CampaignSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  reward_type: {
    type: String,
    required: false,
  },
  commission_type: {
    type: String,
    required: false,
  },
  reward_amount: {
    type: Number,
    required: false,
  },
  auto_approve: {
    type: Boolean,
    required: true,
  },
  minimum_cash_payout: {
    type: Number,
    required: false,
  },
  cookie_life: {
    type: Number,
    required: false,
  },
  referral_code: {
    type: String,
    required: true,
  },
  payout_terms: {
    type: String,
    required: true,
  },
  shop_id: { type: mongoose.Schema.ObjectId, ref: 'Shop' },
  active: {
    type: Boolean,
    required: true,
  },
  init_date: {
    type: Date,
    required: true,
  },
  finish_date: {
    type: Date
  },
  products: [{ type: mongoose.Schema.ObjectId, ref: 'Products' }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const CampaignModel = mongoose.model('Campaign', CampaignSchema);
