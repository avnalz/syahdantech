DO $$
DECLARE
  v_tenant_id INT := 7;
  v_andi INT;
  v_bella INT;
  v_cahya INT;
  v_contact_ids INT[];
  v_idx INT := 0;
  v_phones TEXT[] := ARRAY[
    '6281234560001','6281234560002','6281234560003','6281234560004','6281234560005',
    '6281234560006','6281234560007','6281234560008','6281234560009','6281234560010',
    '6281234560011','6281234560012','6281234560013','6281234560014','6281234560015',
    '6281234560016','6281234560017','6281234560018'
  ];
  v_names TEXT[] := ARRAY[
    'Budi Santoso','Sari Dewi','Rudi Hartono','Linda Permata','Joko Susilo',
    'Maya Anggraini','Doni Setiawan','Rina Kusuma','Eko Prabowo','Putri Maharani',
    'Agus Salim','Nadia Putri','Hendra Wijaya','Dian Sastro','Bayu Pratama',
    'Citra Lestari','Faisal Rahman','Gita Savitri'
  ];
  v_labels TEXT[] := ARRAY['hot','hot','hot','hot','warm','warm','warm','warm','warm','warm','cold','cold','cold','cold','cold','warm','hot','cold'];
  v_stages TEXT[] := ARRAY['negotiation','proposal','qualified','won','contacted','qualified','proposal','contacted','new','qualified','new','new','contacted','new','new','qualified','negotiation','lost'];
  v_scores INT[] := ARRAY[88,82,79,95,65,70,72,60,40,68,25,30,35,20,28,55,90,15];
  v_areas TEXT[] := ARRAY['Canggu','Jakarta Selatan','Ubud','Jakarta Selatan','Seminyak','Jakarta Selatan','Jimbaran','Sanur','Canggu','Ubud','Jakarta Selatan','Seminyak','Sanur','Jimbaran','Canggu','Ubud','Seminyak','Jakarta'];
BEGIN
  -- 1) Insert 3 dummy agents (skip jika email sudah ada)
  INSERT INTO users (tenant_id, name, email, role, is_active, phone)
  SELECT v_tenant_id, n.name, n.email, 'agent', true, n.phone
  FROM (VALUES
    ('Andi Pratama','andi.pratama+dummy@syahdantech.test','628111000111'),
    ('Bella Lestari','bella.lestari+dummy@syahdantech.test','628111000222'),
    ('Cahya Wijaya','cahya.wijaya+dummy@syahdantech.test','628111000333')
  ) AS n(name,email,phone)
  WHERE NOT EXISTS (SELECT 1 FROM users u WHERE u.email = n.email);

  SELECT id INTO v_andi  FROM users WHERE email='andi.pratama+dummy@syahdantech.test';
  SELECT id INTO v_bella FROM users WHERE email='bella.lestari+dummy@syahdantech.test';
  SELECT id INTO v_cahya FROM users WHERE email='cahya.wijaya+dummy@syahdantech.test';

  -- 2) Insert 8 properties (skip jika kode sudah ada)
  INSERT INTO properties (tenant_id, kode, lokasi, area, posisi, kamar, kamar_mandi, luas_bangunan, luas_tanah, harga, legalitas, stok, total_unit, status, is_active, description, img_url)
  SELECT v_tenant_id, p.kode, p.lokasi, p.area, p.posisi, p.kamar, p.kmandi, p.lb, p.lt, p.harga, p.legalitas, p.stok, p.total_unit, 'available', true, p.description, p.img
  FROM (VALUES
    ('VC-D001','Jl. Pantai Berawa, Canggu','Canggu','Hook','3','3','180m²','250m²',4500000000::bigint,'SHM',2,3,'Villa modern dengan private pool, dekat pantai Berawa.','https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800'),
    ('AS-D002','Senayan Residence Tower B','Jakarta Selatan','Tower B Lt.18','2','2','75m²','-',2800000000::bigint,'SHGB',5,10,'Apartemen full furnished dengan view kota Jakarta.','https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'),
    ('TU-D003','Bukit Ubud Pejeng','Ubud','Tengah','-','-','-','500m²',1750000000::bigint,'SHM',1,1,'Tanah view sawah dengan kontur tinggi, cocok untuk villa.','https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=800'),
    ('RK-D004','Jl. Kemang Raya','Jakarta Selatan','Pinggir jalan','-','2','120m²','100m²',3200000000::bigint,'SHGB',1,2,'Ruko 3 lantai strategis di Kemang.','https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=800'),
    ('VS-D005','Jl. Pantai Petitenget','Seminyak','Tengah','4','4','280m²','350m²',7500000000::bigint,'SHM',1,1,'Villa beachfront luxury 4 kamar dengan akses pribadi.','https://images.unsplash.com/photo-1499793983690-e29da59ef1c2?w=800'),
    ('AK-D006','Kuningan City Tower 1','Jakarta Selatan','Tower 1 Lt.25','1','1','45m²','-',1600000000::bigint,'SHGB',8,15,'Studio premium dengan view CBD Kuningan.','https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800'),
    ('TJ-D007','Jimbaran Cliff View','Jimbaran','Cliff','-','-','-','800m²',5500000000::bigint,'SHM',1,1,'Tanah cliff view langsung ke laut, lokasi premium.','https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800'),
    ('VG-D008','Jl. Danau Tamblingan, Sanur','Sanur','Tengah','3','2','150m²','200m²',3800000000::bigint,'SHM',2,4,'Villa garden tropical Bali, family-friendly.','https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800')
  ) AS p(kode,lokasi,area,posisi,kamar,kmandi,lb,lt,harga,legalitas,stok,total_unit,description,img)
  WHERE NOT EXISTS (SELECT 1 FROM properties pr WHERE pr.tenant_id = v_tenant_id AND pr.kode = p.kode);

  -- 3) Insert 18 contacts (skip jika phone sudah ada)
  FOR v_idx IN 1..18 LOOP
    IF NOT EXISTS (SELECT 1 FROM contacts WHERE tenant_id = v_tenant_id AND phone_number = v_phones[v_idx]) THEN
      INSERT INTO contacts (tenant_id, phone_number, name, mode, lead_score, lead_label, lead_score_signals, pipeline_stage, sentimen, ai_summary, budget, timeline, properti_diminati, assigned_to, last_chat_at, chat_id)
      VALUES (
        v_tenant_id,
        v_phones[v_idx],
        v_names[v_idx],
        CASE WHEN v_idx % 4 = 0 THEN 'human_mode' ELSE 'ai_mode' END,
        v_scores[v_idx],
        v_labels[v_idx],
        CASE v_labels[v_idx]
          WHEN 'hot'  THEN 'Budget jelas, intent tinggi, urgensi minggu ini'
          WHEN 'warm' THEN 'Tertarik area & tipe, masih survey'
          ELSE 'Sekedar tanya-tanya, belum ada budget'
        END,
        v_stages[v_idx],
        CASE WHEN v_scores[v_idx] >= 70 THEN 'positive' WHEN v_scores[v_idx] >= 40 THEN 'neutral' ELSE 'negative' END,
        'Lead tertarik properti di ' || v_areas[v_idx] || '. Stage: ' || v_stages[v_idx] || '.',
        CASE WHEN v_scores[v_idx] >= 80 THEN 5000000000 WHEN v_scores[v_idx] >= 50 THEN 2500000000 ELSE 1500000000 END,
        CASE WHEN v_scores[v_idx] >= 80 THEN 'minggu ini' WHEN v_scores[v_idx] >= 50 THEN '1-3 bulan' ELSE '>3 bulan' END,
        ARRAY[v_areas[v_idx]]::varchar[],
        CASE (v_idx - 1) % 3 WHEN 0 THEN v_andi WHEN 1 THEN v_bella ELSE v_cahya END,
        NOW() - (v_idx || ' hours')::interval,
        v_phones[v_idx] || '@s.whatsapp.net'
      );
    END IF;
  END LOOP;

  SELECT array_agg(id ORDER BY id) INTO v_contact_ids FROM contacts WHERE tenant_id = v_tenant_id AND phone_number = ANY(v_phones);

  -- 4) Chat logs (4-5 pesan per kontak)
  FOR v_idx IN 1..array_length(v_contact_ids,1) LOOP
    IF NOT EXISTS (SELECT 1 FROM chat_logs WHERE tenant_id = v_tenant_id AND phone_number = v_phones[v_idx]) THEN
      INSERT INTO chat_logs (tenant_id, phone_number, message, direction, created_at, session)
      VALUES
        (v_tenant_id, v_phones[v_idx], 'Halo, saya tertarik properti di ' || v_areas[v_idx] || '. Bisa info lebih lanjut?', 'inbound',  NOW() - (v_idx*3 || ' hours')::interval, v_phones[v_idx]),
        (v_tenant_id, v_phones[v_idx], 'Halo Bapak/Ibu ' || v_names[v_idx] || '! Boleh info budget & timeline rencana belinya?', 'outbound_ai', NOW() - (v_idx*3 - 1 || ' hours')::interval, v_phones[v_idx]),
        (v_tenant_id, v_phones[v_idx], CASE WHEN v_scores[v_idx]>=70 THEN 'Budget sekitar 3-5M, secepatnya bulan ini.' WHEN v_scores[v_idx]>=40 THEN 'Sekitar 2M, masih lihat-lihat dulu.' ELSE 'Belum tau pasti, masih survey aja.' END, 'inbound', NOW() - (v_idx*3 - 2 || ' hours')::interval, v_phones[v_idx]),
        (v_tenant_id, v_phones[v_idx], 'Siap, saya kirimkan beberapa pilihan properti di ' || v_areas[v_idx] || ' yang sesuai.', 'outbound_ai', NOW() - (v_idx*3 - 3 || ' minutes')::interval, v_phones[v_idx]);
      IF v_scores[v_idx] >= 80 THEN
        INSERT INTO chat_logs (tenant_id, phone_number, message, direction, created_at, session)
        VALUES (v_tenant_id, v_phones[v_idx], 'Boleh dijadwalkan survey lokasi minggu ini?', 'inbound', NOW() - INTERVAL '30 minutes', v_phones[v_idx]);
      END IF;
    END IF;
  END LOOP;

  -- 5) Drip logs untuk lead aktif
  FOR v_idx IN 1..array_length(v_contact_ids,1) LOOP
    IF v_idx <= 12 AND v_labels[v_idx] IN ('hot','warm') THEN
      IF NOT EXISTS (SELECT 1 FROM drip_logs WHERE tenant_id = v_tenant_id AND contact_id = v_contact_ids[v_idx]) THEN
        INSERT INTO drip_logs (tenant_id, contact_id, user_id, chat_id, step, is_completed, sent_at, created_at, updated_at)
        VALUES (
          v_tenant_id,
          v_contact_ids[v_idx],
          CASE (v_idx - 1) % 3 WHEN 0 THEN v_andi WHEN 1 THEN v_bella ELSE v_cahya END,
          v_phones[v_idx] || '@s.whatsapp.net',
          CASE WHEN v_idx <= 4 THEN 2 WHEN v_idx <= 8 THEN 1 ELSE 0 END,
          v_idx <= 6,
          CASE WHEN v_idx <= 6 THEN NOW() - (v_idx || ' days')::interval ELSE NULL END,
          NOW() - (v_idx + 2 || ' days')::interval,
          NOW() - (v_idx || ' days')::interval
        );
      END IF;
    END IF;
  END LOOP;

END $$;