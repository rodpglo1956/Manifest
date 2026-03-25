-- Add missing pickup_company and delivery_company fields to loads table
-- Per PRD-01 Section 4.2 schema
-- Also adds pickup_reference and delivery_reference (PO numbers)

alter table loads add column pickup_company text;
alter table loads add column delivery_company text;
alter table loads add column pickup_reference text;
alter table loads add column delivery_reference text;
