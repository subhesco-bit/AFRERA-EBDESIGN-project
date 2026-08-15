-- Seed data for regional_variety_directory — transcribed verbatim (facts
-- only: names, states, GI numbers, botanical/commercial notes) from the
-- user-provided source document. Idempotent: skips rows that already exist
-- by (category, product_name) so re-running migrations is safe.

INSERT INTO regional_variety_directory (category, product_name, primary_states, gi_status, gi_application_no, variety_detail, specialty_usp, commercial_potential) VALUES
-- Fruits: Citrus
('Citrus', 'Khasi Mandarin Orange', 'Meghalaya', 'registered', '465', NULL, 'High sweetness, thin smooth rind, and rich flavour; grown in high-rainfall zones.', 'Fresh consumption, premium juice extraction, and essential oil processing.'),
('Citrus', 'Assam Mandarin', 'Assam', 'non_gi', NULL, NULL, 'High aroma, intense volatile rind oils, and balanced acidity.', 'Bulk commercial juice concentrate and export markets.'),
('Citrus', 'Kachai Lemon', 'Manipur', 'registered', '466', NULL, 'Locally known as Kachai Champra; highest concentration of ascorbic acid globally.', 'Fresh culinary use, pickling, and freeze-dried juice powder processing.'),
('Citrus', 'Naga Sweet Orange', 'Nagaland', 'non_gi', NULL, NULL, 'Low acidity, high sweetness, and organically cultivated in hilly terrains.', 'Fresh retail fruit and premium organic segments.'),
('Citrus', 'Galgal (Citrus pseudolimon)', 'Arunachal Pradesh', 'non_gi', NULL, 'Citrus pseudolimon', 'Large, highly acidic fruits rich in pectin and medicinal citric acid.', 'Heavy pickling, citrus vinegar, and industrial citric acid extraction.'),
('Citrus', 'Pomelo (Robab Tenga)', 'Mizoram, Assam', 'non_gi', NULL, NULL, 'Extremely large fruit with pink or white segment sacs; high in potassium, copper, and vitamin C.', 'Fresh salads, commercial juice blending, and high-pectin marmalades.'),
('Citrus', 'Kaffir Lime', 'Mizoram', 'non_gi', NULL, NULL, 'Highly aromatic, wrinkled green rind and bi-lobed leaves rich in citronellal.', 'Essential oil extraction and fresh culinary use in Southeast Asian cuisines.'),
('Citrus', 'Citron', 'Meghalaya', 'non_gi', NULL, NULL, 'Thick, fleshy rind; rich in volatile essential oils and medicinal properties.', 'Candied peel processing, medicinal extracts, and essential oils.'),
-- Fruits: Exotic
('Exotic', 'Kiwi', 'Arunachal Pradesh, Sikkim', 'non_gi', NULL, NULL, 'High ascorbic acid (vitamin C) and actinidin enzyme content; organic mountain crop.', 'Premium fresh retail, dehydrated kiwi slices, and fruit pulp.'),
('Exotic', 'Avocado', 'Meghalaya, Sikkim', 'non_gi', NULL, NULL, 'Rich in monounsaturated fatty acids (oleic acid) and vitamin E; buttery texture.', 'Premium fresh retail and cosmetic-grade cold-pressed oil extraction.'),
('Exotic', 'Dragon Fruit', 'Sikkim', 'non_gi', NULL, NULL, 'High antioxidant content (betalains); emerging climate-resilient crop.', 'Fresh wellness retail and natural organic food colouring.'),
('Exotic', 'Passion Fruit', 'Mizoram, Nagaland', 'non_gi', NULL, NULL, 'Intense tropical aroma, high acidity, and rich yellow pulp; processing grade. Taxed at 5% GST.', 'High-value juice concentrate, squashes, and RTS beverages.'),
('Exotic', 'Persimmon', 'Arunachal Pradesh', 'non_gi', NULL, NULL, 'Rare high-altitude orange fruit; rich in tannins and soluble dietary fibres.', 'Premium fresh dessert fruit and dehydrated sweet slices.'),
('Exotic', 'Plum', 'Sikkim', 'non_gi', NULL, NULL, 'Temperate high-altitude stone fruit; rich in anthocyanins and organic acids.', 'Fresh mountain retail, premium jams, and organic fruit wines.'),
('Exotic', 'Peach', 'Arunachal Pradesh', 'non_gi', NULL, NULL, 'Soft-fleshed mountain crop; high water content and delicate aroma.', 'Premium fresh retail and processed canned halves in syrup.'),
('Exotic', 'Pear', 'Arunachal Pradesh', 'non_gi', NULL, NULL, 'Crispy temperate crop; high stone-cell density and high dietary fibre.', 'Fresh retail, dehydrated fruit leather, and perry (pear cider).'),
('Exotic', 'Apricot', 'Sikkim', 'non_gi', NULL, NULL, 'High-altitude dry fruit potential; rich in beta-carotene and iron.', 'Dehydrated whole apricots and cosmetic apricot kernel oil.'),
('Exotic', 'Cherry', 'Sikkim', 'non_gi', NULL, NULL, 'High-altitude stone fruit; bright red pigmentation and low shelf life.', 'Premium fresh retail and gourmet confectioneries.'),
-- Fruits: Tropical
('Tropical', 'Queen Pineapple', 'Tripura', 'registered', '436', NULL, 'Deep yellow color, extremely sweet taste, low fiber, and low acidity.', 'Fresh luxury export, vacuum-dried slices, and premium canned rings.'),
('Tropical', 'Kew Pineapple', 'Assam', 'non_gi', NULL, NULL, 'Large, juicy fruit; ideal processing grade with high juice recovery.', 'Commercial juice concentrate, squashes, and canned pieces.'),
('Tropical', 'Banana', 'All States', 'non_gi', NULL, NULL, 'Rich diversity including red, green, and culinary cooking varieties.', 'Fresh local markets, banana chips, and organic starch processing.'),
('Tropical', 'Papaya', 'All States', 'non_gi', NULL, NULL, 'High yield; rich in papain enzyme and dietary fiber.', 'Green papaya latex extraction, candy (tutti-frutti), and pulp.'),
('Tropical', 'Mango', 'Assam, Tripura', 'non_gi', NULL, NULL, 'Local high-aroma varieties suited for humid subtropical zones.', 'Fresh local retail, green mango pickling, and pulp concentrate.'),
('Tropical', 'Jackfruit', 'Assam, Tripura', 'non_gi', NULL, NULL, 'Massive size; high starch and protein content. GI application unsuccessful.', 'Green jackfruit meat-substitute chunks, chips, and seed flour.'),
('Tropical', 'Guava', 'Assam', 'non_gi', NULL, NULL, 'High vitamin C and pectin content; pink and white pulp varieties.', 'Fresh retail, high-viscosity guava jelly, and RTS beverages.'),
('Tropical', 'Litchi', 'Tripura, Assam', 'registered', NULL, 'Tezpur Litchi', 'Extremely sweet, juicy pulp with a deep red rind and pleasant aroma.', 'Premium fresh retail, canned pulp, and exotic export markets.'),
('Tropical', 'Custard Apple', 'Meghalaya', 'non_gi', NULL, NULL, 'Sweet, creamy pulp with high caloric density and calcium levels.', 'Fresh local markets and premium ice-cream pulp base.'),
-- Fruits: Wild
('Wild', 'Sohiong (Khasi Cherry)', 'Meghalaya', 'pending', NULL, 'Prunus nepalensis', 'Dark blackish-purple berry; rich in anthocyanins.', 'Premium functional beverages, kombucha, and organic wines.'),
('Wild', 'Sohshang', 'Meghalaya', 'pending', NULL, 'Elaeagnus latifolia', 'Oval/oblong pinkish-red berry; highly acidic.', 'Gourmet ethnic pickling, jams, and home-processed preserves.'),
('Wild', 'Wild Apple', 'Arunachal Pradesh', 'non_gi', NULL, NULL, 'High-altitude, sour forest fruit; high pectin and polyphenol content.', 'Dried wild apple slices, herbal teas, and traditional medicines.'),
('Wild', 'Wild Pear', 'Arunachal Pradesh', 'non_gi', NULL, NULL, 'Small, gritty green fruits; astringent and highly fibrous landrace.', 'Traditional medicine, vinegar production, and wild cider brewing.'),
-- Vegetables: Leafy
('Leafy Vegetable', 'Lai Patta (Leafy Mustard)', 'Assam, Sikkim, Arunachal Pradesh', 'non_gi', NULL, 'Brassica juncea var. rugosa; lines JorMLG-1 & JorMLP-2', 'Rich in ascorbic acid, calcium, and iron.', 'Dehydrated greens, traditional saag, and fermented gundruk.'),
('Leafy Vegetable', 'Mustard Greens', 'Nagaland, Manipur', 'non_gi', NULL, 'Hangam', 'High chlorophyll and glucosinolate content; peppery flavour.', 'Pressed mustard seed oil, fresh local greens, and dried condiments.'),
('Leafy Vegetable', 'Perilla Leaves', 'Mizoram, Nagaland', 'non_gi', NULL, 'Mentha-like landraces', 'Exceptionally high in rosmarinic acid, omega-3 fatty acids, and aromatic oils.', 'Fresh culinary garnishes, herbal extracts, and aromatic teas.'),
('Leafy Vegetable', 'Tree Bean Leaves', 'Manipur, Nagaland', 'non_gi', NULL, 'Yongchak Leaves', 'Rich in sulfur compounds and amino acids; traditional tribal vegetable.', 'Fresh local salads and traditional medicinal decoctions.'),
('Leafy Vegetable', 'Roselle Leaves', 'Assam, Meghalaya', 'non_gi', NULL, 'Hibiscus sabdariffa; JorRS 10-02', 'Sharp sour flavor due to high citric and malic acids.', 'Sour curry bases, herbal infusions, and natural pink food colourants.'),
('Leafy Vegetable', 'Water Spinach', 'Assam', 'non_gi', NULL, 'Kalmou Saag', 'Fast-growing aquatic green; exceptionally high in iron and vitamin A.', 'Fresh local table greens and animal fodder.'),
('Leafy Vegetable', 'Amaranthus', 'All States', 'non_gi', NULL, 'Jorhat Promising Lines', 'High-iron, fast-growing leafy amaranth; rich in calcium and amino acids.', 'Fresh local retail, green smoothies, and dehydrated leaf powders.'),
('Leafy Vegetable', 'Colocasia Leaves', 'Nagaland, Manipur', 'non_gi', NULL, 'Nuo / Taro leaves', 'High in dietary fibre and vitamins; base for traditional fermentations.', 'Processed into smoked Anishi patties and traditional leaf wraps.'),
-- Vegetables: Root
('Root Vegetable', 'Yam', 'Nagaland, Mizoram', 'non_gi', NULL, 'High-altitude landraces', 'Heavily cultivated in Jhum plots; high starch density and calorie source.', 'Raw tuber sales, dehydrated yam flour, and traditional baking base.'),
('Root Vegetable', 'Elephant Foot Yam', 'Assam', 'non_gi', NULL, 'Amorphophallus paeoniifolius', 'Highly productive; containing medicinal alkaloids and high-quality starch.', 'Yam starch extraction, commercial chips, and pickling.'),
('Root Vegetable', 'Sweet Potato', 'Meghalaya, Assam', 'non_gi', NULL, 'Orange & Purple cultivars', 'High beta-carotene and anthocyanin levels; highly sweet and non-fibrous.', 'Dehydrated sweet potato flour, organic vacuum chips, and starch.'),
('Root Vegetable', 'Tapioca (Cassava)', 'Meghalaya, Arunachal Pradesh', 'non_gi', NULL, 'Jhum landraces', 'High-starch drought-tolerant root; staple security crop.', 'Industrial sago tapioca pearls, premium starch, and alcohol brewing.'),
('Root Vegetable', 'Taro', 'All States', 'non_gi', NULL, 'Colocasia esculenta', 'Dense, sticky tubers containing mucilage and high starch.', 'Fresh retail, taro chips, and thickeners for gourmet soup bases.'),
('Root Vegetable', 'Radish', 'Sikkim', 'non_gi', NULL, 'Red & White winter varieties', 'Long, crisp roots; high water content and distinct peppery heat.', 'Fresh retail, sun-dried radish slices, and fermented sinki.'),
('Root Vegetable', 'Carrot', 'Sikkim, Arunachal Pradesh', 'non_gi', NULL, 'Orange organic landraces', 'Sweet, crisp root; high beta-carotene and soluble sugars.', 'Fresh organic retail, canned carrot juice, and baby food pulp.'),
('Root Vegetable', 'Beetroot', 'Sikkim', 'non_gi', NULL, 'Deep purple landraces', 'Rich in betalains and nitrates; grown in temperate soils.', 'Fresh retail, natural beetroot powder, and wellness juices.'),
('Root Vegetable', 'Turnip', 'Sikkim', 'non_gi', NULL, 'Himalayan white turnip', 'Cold-hardy root; high in vitamin C and dietary potassium.', 'Winter vegetable retail, pickling, and dehydrated animal feed.'),
-- Vegetables: Cruciferous
('Cruciferous', 'Cabbage', 'All States', 'non_gi', NULL, 'Winter heavy-drum types', 'Highly productive; sweet, tightly packed heads with high water retention.', 'Fresh bulk markets, sauerkraut processing, and dehydrated shreds.'),
('Cruciferous', 'Cauliflower', 'Assam', 'non_gi', NULL, 'Early & Late white varieties', 'Solid curds; high commercial volume and premium visual appeal.', 'Fresh bulk retail, mixed vegetable pickling, and frozen florets.'),
('Cruciferous', 'Broccoli', 'Sikkim, Meghalaya', 'non_gi', NULL, 'Premium organic green', 'Extremely high in glucoraphanin; premium cold-climate vegetable.', 'High-value fresh retail, dehydrated broccoli powder, and frozen cuts.'),
('Cruciferous', 'Kale', 'Sikkim', 'non_gi', NULL, 'Emerging winter green', 'Cold-tolerant, nutrient-dense curly leaves; high in vitamin K and iron.', 'Fresh organic wellness markets and freeze-dried kale chips.'),
-- Vegetables: Beans
('Beans', 'French Bean', 'Sikkim', 'non_gi', NULL, 'Hilly climbing cultivars', 'Stringless, tender green pods; high protein and soluble fiber content.', 'Fresh retail markets and industrial quick-freezing (IQF) lines.'),
('Beans', 'Runner Bean', 'Arunachal Pradesh, Sikkim', 'non_gi', NULL, 'High-altitude varieties', 'Large, flat green pods with red/purple seeds; highly cold-resistant.', 'Mountain retail and frozen vegetable mixes.'),
('Beans', 'Tree Bean', 'Manipur, Nagaland', 'non_gi', NULL, 'Parkia speciosa (Yongchak)', 'High in protein, iron, and sulfur; strong, pungent, nutty aroma.', 'Premium fresh retail, sun-dried seeds, and gourmet canning.'),
('Beans', 'Soybean (Vegetable)', 'Nagaland, Manipur', 'non_gi', NULL, 'Hairless green pod types', 'High vegetable-protein density; harvested when pods are young.', 'Edamame-style processing, frozen green pods, and fresh local retail.'),
-- Vegetables: Cucurbits
('Cucurbits', 'Bottle Gourd', 'Assam', 'non_gi', NULL, 'Traditional landraces', 'High water content, cooling properties, and delicate fibrous flesh.', 'Fresh local markets, commercial juice processing, and candy (petha).'),
('Cucurbits', 'Bitter Gourd', 'Assam, Manipur', 'non_gi', NULL, 'Small wild types', 'Rich in charantin and polypeptide-p; strong antidiabetic properties.', 'Fresh retail, antidiabetic dried slices, and wellness powders.'),
('Cucurbits', 'Ridge Gourd', 'Assam', 'non_gi', NULL, 'JorRG 09-05', 'High-yielding selection; tender, non-fibrous culinary ribs.', 'Fresh local vegetable markets and organic fiber sponges (matured).'),
('Cucurbits', 'Pumpkin', 'Assam', 'non_gi', NULL, 'High-carotene landraces', 'Highly sweet, deep orange flesh; excellent storage capability.', 'Dehydrated pumpkin powder, seed oil extraction, and purees.'),
('Cucurbits', 'Cucumber', 'Nagaland', 'registered', NULL, 'Naga Cucumber (GI Tagged)', 'Extremely sweet, juicy, crisp, and completely free of chemical residue.', 'Premium fresh retail, cooling cosmetic gels, and low-salt brined pickles.'),
('Cucurbits', 'Squash', 'Mizoram, Sikkim', 'non_gi', NULL, 'Chayote (Isis)', 'Highly productive pear-shaped cucurbit; high water and mild starch.', 'Fresh bulk markets, commercial pickling, and animal feed silage.'),
-- Vegetables: Mushroom
('Mushroom', 'Oyster Mushroom', 'Meghalaya, Assam', 'non_gi', NULL, 'Pleurotus ostreatus', 'Highly productive on straw substrates; high protein and vitamin D.', 'Fresh retail, dehydrated mushroom shreds, and savory soup powders.'),
('Mushroom', 'Shiitake', 'Sikkim, Nagaland', 'non_gi', NULL, 'Lentinula edodes', 'Wood-grown premium mushroom; extremely rich in lenthionine umami.', 'Premium fresh retail, dehydrated whole shiitake, and wellness extracts.'),
('Mushroom', 'Button Mushroom', 'Assam', 'non_gi', NULL, 'Agaricus bisporus', 'Large-scale commercial production; high volume demand.', 'Fresh retail and industrial pickling / canning in brine.'),
('Mushroom', 'Wild Mushrooms', 'Nagaland, Manipur', 'non_gi', NULL, 'Forest-collected types', 'Exceptional variety of seasonal mushrooms collected from deep woods.', 'Gourmet restaurant supplies and dehydrated specialty mushroom blends.')
ON CONFLICT DO NOTHING;

INSERT INTO regional_variety_directory (category, product_name, primary_states, gi_status, gi_application_no, variety_detail, specialty_usp, commercial_potential) VALUES
-- Chillies and Spices
('Spice', 'Bhut Jolokia', 'Assam, Nagaland', 'non_gi', NULL, NULL, 'High heat index; up to 1,000,000 Scoville Heat Units (SHU).', 'Capsaicin extraction, defense-grade pepper sprays, and extreme hot sauces.'),
('Spice', 'Raja Mircha', 'Nagaland', 'registered', '122', NULL, 'Highly pungent (800,000-1,000,000 SHU) with a unique smoky flavor.', 'High-value organic exports, specialty chili powders, and hot sauces.'),
('Spice', 'Bird''s Eye Chilli', 'Mizoram', 'registered', '427', NULL, 'Small, intensely pungent chillies; rich in vitamins.', 'Lowered 5% GST on packaged products; ideal for flakes and spice oils.'),
('Spice', 'Dalle Khursani', 'Sikkim', 'registered', '636', NULL, 'Red cherry pepper; high pungency (100,000-350,000 SHU).', 'Premium chili paste, direct export, and gourmet vinegar pickles.'),
('Spice', 'Ginger (Karbi Anglong)', 'Assam', 'registered', '226', NULL, 'Low fiber in Aizol variety; high oleoresin oil recovery (Gingerin).', 'Essential oil extraction, dry powder, ginger ale, and pharmaceuticals.'),
('Spice', 'Lakadong Turmeric', 'Meghalaya', 'registered', NULL, NULL, 'Curcumin content of 7% to 12%; bright golden-yellow hue.', 'Turmeric latte mixes, oleoresin extraction, and nutraceutical tablets.'),
('Spice', 'Black Turmeric', 'Assam', 'non_gi', NULL, 'Curcuma caesia', 'Dark bluish-black rhizome; rich in camphor and cineole.', 'High-value medicinal extracts, essential oils, and traditional cosmetics.'),
('Spice', 'Turmeric (General)', 'All States', 'non_gi', NULL, NULL, 'Standard regional varieties; average curcumin content of 3% to 5%.', 'Bulk dry turmeric powder, culinary blends, and natural dye processing.'),
('Spice', 'Large Cardamom', 'Sikkim', 'registered', '376', NULL, 'Bold capsules with a strong smoky, camphoraceous aroma.', 'Premium whole spice exports, cardamom oil, and aromatic blends.'),
('Spice', 'Cinnamon', 'Arunachal Pradesh', 'non_gi', NULL, 'Cinnamomum verum', 'Sweet, delicate, woody aroma.', 'Aromatic spice quill packaging, bakery blends, and essential oils.'),
('Spice', 'Bay Leaf (Tej Patta)', 'Meghalaya', 'non_gi', NULL, NULL, 'Sourced around Shillong; high essential oil content.', 'Whole-leaf export packaging, bay leaf powder, and essential oils.'),
('Spice', 'Black Pepper', 'Tripura, Meghalaya', 'non_gi', NULL, NULL, 'Bold black peppercorns; high piperine content and intense heat.', 'Premium whole-corn table spice, ground pepper shakers, and oleoresins.'),
('Spice', 'Long Pepper', 'Assam', 'non_gi', NULL, 'Piper longum (Pipli)', 'Sweet-pungent woody heat; high piperine content.', 'Ayurvedic formulations, cough syrups, and exotic spice blends.'),
('Spice', 'Perilla Seed', 'Nagaland', 'non_gi', NULL, 'Known as Kenye', 'Rich in alpha-linolenic acid (omega-3) and proteins.', 'Cold-pressed perilla oil, roasted seed seasonings, and traditional chutneys.'),
('Spice', 'Coriander', 'Meghalaya', 'non_gi', NULL, NULL, 'High-aroma coriander varieties grown in moist valley soils.', 'Premium ground coriander spice, fresh leaf retail, and culinary pastes.'),
('Spice', 'Fennel', 'Sikkim', 'non_gi', NULL, NULL, 'Sweet, anise-like seeds rich in anethole; grown in cold climates.', 'Mouth freshener packaging, digestive tea blends, and sweet spice oils.'),
('Spice', 'Star Anise', 'Arunachal Pradesh', 'non_gi', NULL, 'Illicium griffithii', 'Star-shaped carpels rich in shikimic acid.', 'Tamiflu precursor synthesis, incense, tea flavoring, and spice blends.'),
('Spice', 'Clove', 'Sikkim', 'non_gi', NULL, NULL, 'Premium flower buds rich in eugenol; intense numbing heat.', 'Culinary spice exports, clove essential oil, and oral-care formulations.'),
('Spice', 'Nutmeg', 'Tripura', 'non_gi', NULL, NULL, 'Tropical seed rich in myristicin and sweet aromatic oils.', 'Ground nutmeg powder, mace blade packaging, and aromatic extracts.'),
-- Unique Fermented Foods
('Fermented Food', 'Akhuni / Axone', 'Nagaland', 'non_gi', NULL, 'Whole Yellow Soybeans; alkaline solid-state; proteolytic Bacillus spp.', 'Pungent, brown umami paste; used in traditional smoked pork stews.', NULL),
('Fermented Food', 'Tungrymbai', 'Meghalaya', 'non_gi', NULL, 'Soybeans, Pyrnium leaves; proteolytic breakdown by Bacillus subtilis', 'Dense sticky paste; rich in protein and probiotics; served cooked with pork.', NULL),
('Fermented Food', 'Hawaijar', 'Manipur', 'non_gi', NULL, 'Yellow Soybeans; spontaneous Bacillus-driven alkaline process', 'Stringy fermented beans; high protein; key ingredient in Manipuri side dishes.', NULL),
('Fermented Food', 'Bekang', 'Mizoram', 'non_gi', NULL, 'Soybeans; alkaline solid-state; Bacillus spp.', 'Mucilaginous sticky beans with a pleasant, mild ammonia aroma.', NULL),
('Fermented Food', 'Ngari', 'Manipur', 'non_gi', NULL, 'Dry Puntius sophore; anaerobic aging in Kharung clay pots', 'Solid grey fish with a rich, salty-umami flavor; used in Iromba stews.', NULL),
('Fermented Food', 'Shidal', 'Tripura, Assam', 'non_gi', NULL, 'Dry Puntius spp.; semi-dry anaerobic clay pot aging', 'Pungent, paste-like fish; high amino acid content; key curry flavor enhancer.', NULL),
('Fermented Food', 'Hentak', 'Manipur', 'non_gi', NULL, 'Esomus danricus & Alocasia; blended and aged in earthenware pots', 'Dark paste/balls; safe to consume as Alocasia oxalates are broken down.', NULL),
('Fermented Food', 'Tungtap', 'Meghalaya', 'non_gi', NULL, 'Puntius / Danio spp., salt; salted anaerobic fish fermentation', 'Probiotic fish paste; intensely savory and sharp; served as a cold condiment.', NULL),
('Fermented Food', 'Anishi / Nüoshi', 'Nagaland', 'non_gi', NULL, 'Taro / Colocasia leaves; pounded, cooked, and smoked', 'Coal-hard, smoke-dried patties; adds a smoky, sour depth to pork stews.', NULL),
('Fermented Food', 'Mesu', 'Sikkim', 'non_gi', NULL, 'Malingo bamboo shoots; lactic acid bacteria (LAB) driven souring', 'Crisp, sour, tangy shredded shoots; used as a pickle or culinary seasoning.', NULL),
('Fermented Food', 'Soibum', 'Manipur', 'non_gi', NULL, 'Dendrocalamus hamiltonii; pounded and fermented over months', 'Sour fermented bamboo shoots; soft texture; used in fish and pork curries.', NULL),
('Fermented Food', 'Soidon', 'Manipur', 'non_gi', NULL, 'Bamboo shoot tips/juice; fermented with wild mustard seeds', 'Delicate sour shoot tips; prized ingredient in stews and Iromba.', NULL),
('Fermented Food', 'Bastenga', 'Mizoram, Nagaland', 'non_gi', NULL, 'Sliced bamboo shoots aged in waterlogged pots', 'Intensely pungent, sour liquid and shoots; base flavor for Naga pork.', NULL),
('Fermented Food', 'Chhurpi', 'Sikkim, Arunachal Pradesh', 'non_gi', NULL, 'Yak / Cow Milk; acid coagulation and sun dehydration', 'Extremely hard, long-lasting cheese cubes; high protein and low moisture.', NULL),
('Fermented Food', 'Kinema', 'Sikkim', 'non_gi', NULL, 'Whole Yellow Soybeans; stringy alkaline fermentation by B. subtilis', 'High-protein stringy beans; pungent, nutty aroma; served fried as side dish.', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO regional_variety_directory (category, product_name, primary_states, gi_status, gi_application_no, variety_detail, specialty_usp, commercial_potential) VALUES
-- Bamboo
('Bamboo', 'Fresh Bamboo Shoot (Bah Gaj)', 'Assam, Nagaland', 'non_gi', NULL, 'Sourced from Bambusa tulda', NULL, 'Low calorie; canned in brine or vacuum-packed.'),
('Bamboo', 'Fermented Bamboo Shoot (Khorisa)', 'Assam, Mizoram', 'non_gi', NULL, 'Fermented in earthen pits', NULL, 'Long shelf life; ideal as a seasoning and ingredient in meat/fish dishes.'),
('Bamboo', 'Bamboo Shoot Pickle', 'All States', 'non_gi', NULL, 'Infused with mustard oil and Bhut Jolokia', NULL, 'High-value retail condiment; widely distributed.'),
('Bamboo', 'Bamboo Shoot Powder', 'Manipur', 'non_gi', NULL, 'Dehydrated and finely milled shoots', NULL, 'Natural food thickener, fiber fortifier, and enhancer.'),
('Bamboo', 'Bamboo Tea', 'Mizoram', 'non_gi', NULL, 'Sourced from tender organic bamboo leaves', 'High in silica.', 'Marketed as a premium wellness infusion.'),
-- Honey
('Honey', 'Wild Forest Honey', 'Arunachal Pradesh', 'non_gi', NULL, 'Collected from wild hives of Apis dorsata', 'Rich, dark color; high complex sugars; therapeutic grade.', NULL),
('Honey', 'Rock Bee Honey', 'Meghalaya', 'non_gi', NULL, 'Sourced from high-altitude rock faces', 'Intense herbal properties; strong antioxidant and floral notes.', NULL),
('Honey', 'Stingless Bee Honey', 'Nagaland', 'non_gi', NULL, 'Sourced from Meliponini bee hives', 'High value; sourish-sweet profile; strong antibacterial properties.', NULL),
('Honey', 'Organic Honey', 'Sikkim', 'non_gi', NULL, 'Nectar from organic mountain wildflowers', 'Certified organic.', 'High-value retail packing and export.'),
('Honey', 'Bamboo Honey', 'Mizoram', 'non_gi', NULL, 'Rare honeydew collected from bamboo stalks', 'Exotic wellness product with sweet, woody flavor notes.', NULL),
-- Grains
('Grain', 'Joha Rice', 'Assam', 'non_gi', NULL, 'Kola Joha, Keteki Joha, Bokul Joha', 'Aromatic short-grain; rich in omega-3/omega-6 and antioxidants.', NULL),
('Grain', 'Bao Rice', 'Assam', 'non_gi', NULL, 'LPR 106, KDML 105, Padmapani', 'Red-kernelled deep-water floating rice; high iron and zinc.', NULL),
('Grain', 'Black Rice (Chakhao)', 'Manipur', 'registered', NULL, 'Chakhao Amubi, Chakhao Poireiton', 'Scented glutinous rice; rich in anthocyanins.', NULL),
('Grain', 'Finger Millet (Marua)', 'Sikkim, Arunachal Pradesh', 'non_gi', NULL, 'Traditional high-altitude crop', 'Gluten-free, rich in calcium and dietary fiber; drought-hardy.', NULL),
('Grain', 'Foxtail Millet', 'Nagaland', 'non_gi', NULL, 'Organic hill landrace', 'Rich in protein, magnesium, and dietary fiber; low glycemic index.', NULL),
-- Pulses
('Pulse', 'Rajma (Kidney Beans)', 'Sikkim, Arunachal Pradesh', 'non_gi', NULL, 'Libi Balangbu, Andoye Kidney Bean', 'Hilly, cold-climate landraces; dense in plant protein.', NULL),
('Pulse', 'Black Gram (Urad)', 'Assam', 'non_gi', NULL, 'Traditional landraces', 'High nitrogen-fixing crop; small seeds with a rich, earthy flavor.', NULL),
('Pulse', 'Green Gram (Moong)', 'Assam', 'non_gi', NULL, 'Organic riverbank crops', 'Fast-growing pulse; highly digestible, light plant-protein source.', NULL),
('Pulse', 'Pigeon Pea (Arhar)', 'All States', 'non_gi', NULL, 'Hilly, drought-hardy landraces', 'Deep-rooting shrub; high protein and fiber; staple security crop.', NULL),
-- Oilseeds
('Oilseed', 'Mustard Seed', 'Assam, Manipur', 'non_gi', NULL, 'Brassica juncea varieties', 'High-pungency seeds; rich in glucosinolates and sulfur.', NULL),
('Oilseed', 'Perilla Seed (Oilseed)', 'Nagaland, Mizoram', 'non_gi', NULL, 'Perilla frutescens', 'Edible oil rich in omega-3 (ALA), protein, and antioxidants.', NULL),
('Oilseed', 'Sesame Seed', 'Tripura, Assam', 'non_gi', NULL, 'Black & White varieties', 'High oil recovery rate; rich in lignans (sesamin) and vitamin E.', NULL),
-- Nuts
('Nut', 'Arecanut (Kwai / Gue)', 'Meghalaya', 'non_gi', NULL, NULL, 'Firm kernel structure; durable chew.', 'High local demand; processed into dried supari cuts.'),
('Nut', 'Walnut', 'Sikkim, Arunachal Pradesh', 'non_gi', NULL, 'Temperate high-altitude varieties', 'Large-shelled nuts; rich in polyunsaturated fats and polyphenols.', NULL),
('Nut', 'Chestnut', 'Sikkim', 'non_gi', NULL, 'Himalayan chestnut (Castanopsis spp.)', 'Sweet, starchy nuts; low fat compared to other culinary nuts.', NULL),
-- Tea / Coffee
('Tea/Coffee', 'Assam Tea', 'Assam', 'non_gi', NULL, 'Camellia sinensis var. assamica', 'World''s strongest black tea; high in caffeine and polyphenols.', NULL),
('Tea/Coffee', 'Orthodox Tea', 'Assam', 'registered', '115', NULL, 'High-grade whole leaves with distinct floral and honey notes.', NULL),
('Tea/Coffee', 'Singpho Tea (Phalap)', 'Arunachal Pradesh, Assam', 'non_gi', NULL, 'Smoked bamboo-processed tea', 'Formed into dry cylinders; distinct wood-smoke aroma.', NULL),
('Tea/Coffee', 'Arabica Coffee', 'Arunachal Pradesh, Meghalaya', 'non_gi', NULL, 'Hills Arabica varieties', 'High-altitude crop; bright acidity, floral body, and notes of cocoa.', NULL),
('Tea/Coffee', 'Robusta Coffee', 'Tripura', 'non_gi', NULL, 'Lowland robusta varieties', 'Heavy body, low acidity, high caffeine; excellent crema density.', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO regional_variety_directory (category, product_name, primary_states, gi_status, gi_application_no, variety_detail, specialty_usp, commercial_potential) VALUES
-- Animal Products
('Animal Product', 'Yak Milk', 'Arunachal Pradesh, Sikkim', 'non_gi', NULL, 'Arunachali Yak', 'High fat (10.9%).', 'Processed into Churpi yak cheese.'),
('Animal Product', 'Mithun Meat', 'Arunachal Pradesh, Nagaland', 'non_gi', NULL, 'Bos frontalis', 'Exceptionally tender and low-fat organic meat; highly valued.', NULL),
('Animal Product', 'Indigenous Pork', 'Nagaland, Meghalaya', 'non_gi', NULL, 'Tenyi Vo, Niang Megha, Wak Chambil', 'Highly adapted swine; sweet fat profile and aromatic lean pork.', NULL),
('Animal Product', 'Free Range Chicken', 'Assam, Arunachal Pradesh', 'non_gi', NULL, 'Kamrupa, Miri (Porog)', 'Scavenging habit; high-protein meat with a firm texture.', NULL),
('Animal Product', 'Duck Meat', 'Assam', 'non_gi', NULL, 'Nageswari Duck', 'Prized dark meat; high fat content and distinct gamey flavour.', NULL),
-- Fisheries
('Fisheries', 'Freshwater Prawn', 'Tripura, Assam', 'non_gi', NULL, 'Macrobrachium rosenbergii', 'High value; large size, sweet firm meat; grown in fresh ponds.', NULL),
('Fisheries', 'River Fish', 'Arunachal Pradesh, Nagaland', 'non_gi', NULL, 'Tor putitora, Neolissochilus', 'Wild-caught Mahseer and carps; firm flesh and high protein.', NULL),
('Fisheries', 'Smoked Fish', 'Assam, Manipur', 'non_gi', NULL, 'Small river carps', 'Smoke-cured over kitchen fires; highly shelf-stable.', NULL),
('Fisheries', 'Fermented Fish', 'Manipur, Tripura', 'non_gi', NULL, 'Ngari, Shidal, Hentak, Tungtap', 'Anaerobically fermented small river carps.', NULL),
-- Forest
('Forest Edible', 'Wild Fern (Dhekia)', 'Assam', 'non_gi', NULL, 'Matteuccia struthiopteris', 'Fiddlehead greens; rich in iron, fiber, and antioxidant vitamins.', NULL),
('Forest Edible', 'Wild Berries', 'Meghalaya', 'non_gi', NULL, 'Sohiong, Sohshang, Sohphie', 'Nutrient-dense, highly perishable wild stone fruits.', NULL),
('Forest Edible', 'Wild Citrus', 'Meghalaya', 'non_gi', NULL, 'Memong Narang (Citrus indica)', 'Endangered wild orange; high genetic resistance and raw acidity.', NULL)
ON CONFLICT DO NOTHING;
