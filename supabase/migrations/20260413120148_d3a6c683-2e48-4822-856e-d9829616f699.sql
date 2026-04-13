UPDATE properties SET img_url = CASE id
  WHEN 1 THEN 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=400&fit=crop'
  WHEN 2 THEN 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=400&fit=crop'
  WHEN 3 THEN 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=400&fit=crop'
  WHEN 4 THEN 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=600&h=400&fit=crop'
  WHEN 5 THEN 'https://images.unsplash.com/photo-1613977257363-707ba9348227?w=600&h=400&fit=crop'
  WHEN 6 THEN 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=400&fit=crop'
  WHEN 7 THEN 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=400&fit=crop'
  WHEN 8 THEN 'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&h=400&fit=crop'
  WHEN 9 THEN 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=400&fit=crop'
  WHEN 10 THEN 'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&h=400&fit=crop'
END
WHERE id BETWEEN 1 AND 10 AND (img_url IS NULL OR img_url = '');