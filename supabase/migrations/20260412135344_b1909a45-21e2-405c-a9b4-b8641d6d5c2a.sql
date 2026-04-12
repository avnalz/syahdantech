
-- Insert dummy contacts
INSERT INTO public.contacts (phone_number, name, lead_label, lead_score, mode, last_chat_at, ai_summary, tenant_id, pipeline_stage, sentimen, lead_score_signals)
VALUES
  ('6281200001111', 'Budi Santoso', 'hot', 85, 'human_mode', NOW() - INTERVAL '1 hour', 'Tertarik unit tipe 45 di blok A, minta jadwal survey minggu depan', 1, 'negotiation', 'positif', 'budget match, timeline urgent'),
  ('6281200002222', 'Siti Rahayu', 'hot', 78, 'ai_mode', NOW() - INTERVAL '3 hours', 'Sudah lihat brosur, tanya soal cicilan KPR dan DP minimum', 1, 'qualified', 'positif', 'high engagement, repeat visit'),
  ('6281200003333', 'Ahmad Fauzi', 'warm', 62, 'ai_mode', NOW() - INTERVAL '5 hours', 'Tanya harga dan lokasi, belum tentukan tipe rumah', 1, 'contacted', 'netral', 'price inquiry, location match'),
  ('6281200004444', 'Rina Wulandari', 'warm', 55, 'human_mode', NOW() - INTERVAL '8 hours', 'Bandingkan dengan developer lain, minta diskon', 1, 'qualified', 'netral', 'comparison shopping'),
  ('6281200005555', 'Dedi Kurniawan', 'warm', 50, 'ai_mode', NOW() - INTERVAL '12 hours', 'Tanya tentang fasilitas dan akses jalan', 1, 'contacted', 'positif', 'facility interest'),
  ('6281200006666', 'Maya Putri', 'cold', 30, 'ai_mode', NOW() - INTERVAL '1 day', 'Hanya tanya info umum, belum ada ketertarikan spesifik', 1, 'new', 'netral', 'general inquiry'),
  ('6281200007777', 'Hendra Wijaya', 'hot', 90, 'human_mode', NOW() - INTERVAL '30 minutes', 'Siap booking unit tipe 60, minta nomor rekening DP', 1, 'negotiation', 'positif', 'ready to buy, budget confirmed'),
  ('6281200008888', 'Lina Marlina', 'cold', 20, 'ai_mode', NOW() - INTERVAL '2 days', 'Chat singkat, tidak responsif', 1, 'new', 'negatif', 'low engagement'),
  ('6281200009999', 'Rudi Hermawan', 'warm', 58, 'ai_mode', NOW() - INTERVAL '6 hours', 'Tanya soal sertifikat dan legalitas tanah', 1, 'contacted', 'netral', 'legal concern'),
  ('6281200010000', 'Fitri Handayani', 'hot', 82, 'ai_mode', NOW() - INTERVAL '2 hours', 'Mau ambil 2 unit untuk investasi, tanya harga grosir', 1, 'qualified', 'positif', 'investor, multi-unit')
ON CONFLICT (phone_number) DO NOTHING;

-- Insert dummy chat logs
INSERT INTO public.chat_logs (phone_number, direction, message, session, tenant_id, created_at)
VALUES
  ('6281200001111', 'inbound', 'Halo, saya mau tanya unit tipe 45 masih ada?', 'wa-session', 1, NOW() - INTERVAL '2 hours'),
  ('6281200001111', 'outbound_ai', 'Halo Pak Budi! Untuk unit tipe 45 masih tersedia di blok A dan C. Harga mulai dari 450jt. Apakah bapak ingin jadwalkan survey?', 'wa-session', 1, NOW() - INTERVAL '1 hour 55 minutes'),
  ('6281200001111', 'inbound', 'Iya boleh, minggu depan bisa?', 'wa-session', 1, NOW() - INTERVAL '1 hour 50 minutes'),
  ('6281200001111', 'outbound_human', 'Baik Pak Budi, untuk survey bisa hari Sabtu atau Minggu. Bapak prefer jam berapa?', 'web-admin', 1, NOW() - INTERVAL '1 hour'),
  ('6281200002222', 'inbound', 'Permisi, mau tanya soal KPR bisa gak ya?', 'wa-session', 1, NOW() - INTERVAL '4 hours'),
  ('6281200002222', 'outbound_ai', 'Tentu bisa Bu Siti! Kami bekerja sama dengan beberapa bank untuk KPR. DP mulai dari 10%. Mau saya jelaskan simulasi cicilannya?', 'wa-session', 1, NOW() - INTERVAL '3 hours 55 minutes'),
  ('6281200002222', 'inbound', 'Iya tolong simulasi untuk tipe 36 dong', 'wa-session', 1, NOW() - INTERVAL '3 hours 30 minutes'),
  ('6281200002222', 'outbound_ai', 'Untuk tipe 36 harga 350jt, DP 10% = 35jt, cicilan sekitar 2.5jt/bulan tenor 20 tahun. Tertarik Bu?', 'wa-session', 1, NOW() - INTERVAL '3 hours'),
  ('6281200007777', 'inbound', 'Pak saya sudah mantap mau ambil unit tipe 60 blok B no 5', 'wa-session', 1, NOW() - INTERVAL '1 hour'),
  ('6281200007777', 'outbound_human', 'Siap Pak Hendra! Unit tipe 60 blok B5 tersedia. Untuk booking fee 5jt, saya kirimkan nomor rekening ya', 'web-admin', 1, NOW() - INTERVAL '45 minutes'),
  ('6281200007777', 'inbound', 'Oke kirim ya pak, saya transfer hari ini', 'wa-session', 1, NOW() - INTERVAL '30 minutes'),
  ('6281200003333', 'inbound', 'Gan harga rumah di situ berapa ya?', 'wa-session', 1, NOW() - INTERVAL '6 hours'),
  ('6281200003333', 'outbound_ai', 'Halo Pak Ahmad! Harga rumah kami mulai dari 300jt untuk tipe 36 hingga 700jt untuk tipe 72. Lokasi di Jl. Merdeka. Ada tipe yang diminati?', 'wa-session', 1, NOW() - INTERVAL '5 hours 55 minutes'),
  ('6281200003333', 'inbound', 'Yang 300jt itu spec nya gimana?', 'wa-session', 1, NOW() - INTERVAL '5 hours'),
  ('6281200010000', 'inbound', 'Saya investor, mau ambil beberapa unit. Ada harga khusus gak?', 'wa-session', 1, NOW() - INTERVAL '3 hours'),
  ('6281200010000', 'outbound_ai', 'Halo Bu Fitri! Untuk pembelian multiple unit kami ada program khusus. Bisa saya hubungkan dengan tim marketing kami?', 'wa-session', 1, NOW() - INTERVAL '2 hours 55 minutes'),
  ('6281200010000', 'inbound', 'Boleh, saya rencana ambil 2 unit tipe 45 untuk disewakan', 'wa-session', 1, NOW() - INTERVAL '2 hours');
