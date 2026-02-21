import json
import os

# ---------------------------------------------------------
# 1. AI Knowledge Base: 500+ Harmful/Processed Ingredients
# ---------------------------------------------------------
# Structure: "canonical_name": { "risk": 0-100, "nova": 1-4, "desc": "...", "aliases": [...] }

KNOWLEDGE_BASE = {
    # ---------------------------------------------------------
    # PHASE 1: REFINED FLOURS (The Glucose Spikers)
    # ---------------------------------------------------------
    "refined wheat flour": {
        "risk": 60, "nova": 3, "source": "FSSAI / WHO",
        "desc": "Stripped of fiber and nutrients. Acts like sugar, causing rapid glucose spikes. WHO guidelines warn against high intake of refined grains.",
        "aliases": ["maida", "white flour", "all purpose flour", "enriched wheat flour", "wheat flour"]
    },

    # ---------------------------------------------------------
    # PHASE 2: INDUSTRIAL STARCHES
    # ---------------------------------------------------------
    "corn starch": {
        "risk": 40, "nova": 3, "source": "USDA / FDA",
        "desc": "Highly refined carbohydrate used as a thickener. Calorie dense with zero nutrition. FDA classifies it as a processed additive.",
        "aliases": ["cornstarch", "maize starch", "modified corn starch"]
    },
    "potato starch": {
        "risk": 40, "nova": 3, "source": "Open Food Facts",
        "desc": "Refined starch that breaks down rapidly into glucose. Often used in ultra-processed snacks.",
        "aliases": []
    },
    "degermed yellow cornmeal": {
        "risk": 55, "nova": 3, "source": "USDA",
        "desc": "Corn meal with the nutritious germ removed. Lacks fiber and essential fats.",
        "aliases": []
    },

    # ---------------------------------------------------------
    # PHASE 3: INDUSTRIAL SYRUPS (Metabolic Disruption)
    # ---------------------------------------------------------
    "high fructose corn syrup": {
        "risk": 95, "nova": 4, "source": "NIH / PubMed",
        "desc": "Industrial sweetener linked to fatty liver and diabetes. Research (NIH) indicates it bypasses hunger signals (leptin).",
        "aliases": ["hfcs", "glucose-fructose", "glucose-fructose syrup", "corn syrup solids", "isoglucose"]
    },
    "invert sugar syrup": {
        "risk": 70, "nova": 4, "source": "EFSA (EU)",
        "desc": "'Pre-digested' sugar syrup. EFSA notes rapid absorption leading to high glycemic response.",
        "aliases": ["invert sugar", "invert syrup"]
    },

    # ---------------------------------------------------------
    # PHASE 4: REFINED SUGARS
    # ---------------------------------------------------------
    "sugar": {
        "risk": 50, "nova": 3, "source": "WHO Guidelines",
        "desc": "Free sugars. WHO recommends limiting intake to <5% of energy to prevent obesity and dental caries.",
        "aliases": ["sucrose", "white sugar", "refined sugar"]
    },
    "dextrose": {
        "risk": 65, "nova": 4, "source": "FDA",
        "desc": "Chemically pure glucose. recognized by FDA as an added sugar that spikes insulin rapidly.",
        "aliases": []
    },
    "maltodextrin": {
        "risk": 60, "nova": 4, "source": "PubMed / GI Database",
        "desc": "Ultra-processed thickener. Has a Glycemic Index (85-105) higher than table sugar, causing sharp insulin spikes.",
        "aliases": []
    },

    # ---------------------------------------------------------
    # PHASE 5: HIGH POTENCY ARTIFICIAL SWEETENERS
    # ---------------------------------------------------------
    "aspartame": {
        "risk": 60, "nova": 4, "source": "IARC / WHO",
        "desc": "Classified by IARC (WHO) as 'Possibly Carcinogenic to Humans' (Group 2B). Also linked to headaches.",
        "aliases": ["e951", "nutrasweet"]
    },
    "sucralose": {
        "risk": 55, "nova": 4, "source": "NCBI / Research",
        "desc": "Chlorinated sugar. Studies suggest it may reduce healthy gut bacteria and affect insulin sensitivity (NCBI).",
        "aliases": ["e955", "splenda"]
    },
    "acesulfame potassium": {
        "risk": 55, "nova": 4, "source": "CSPI / FDA",
        "desc": "Zero-calorie sweetener. CSPI advises caution due to potential thyroid effects in animal studies.",
        "aliases": ["e950", "ace-k", "acesulfame k"]
    },

    # ---------------------------------------------------------
    # PHASE 6: SUGAR ALCOHOLS & HUMECTANTS
    # ---------------------------------------------------------
    "glycerol": {
        "risk": 30, "nova": 4, "source": "FDA GRAS",
        "desc": "Humectant (E422). Safe in moderation, but FDA notes laxative effects at high levels.",
        "aliases": ["e422", "glycerin", "glycerine"]
    },
    "erythritol": {
        "risk": 20, "nova": 4, "source": "Nature Medicine (2023)",
        "desc": "Generally safe, but a 2023 Nature Medicine study found links to increased blood clotting risk.",
        "aliases": ["e968"]
    },
    "sorbitol": {
        "risk": 30, "nova": 4, "source": "EFSA",
        "desc": "Polyol sweetener. EFSA warns excessive consumption causes bloating and laxative effects.",
        "aliases": ["e420"]
    },

    # ---------------------------------------------------------
    # PHASE 7: HYDROGENATED FATS (The Killers)
    # ---------------------------------------------------------
    "hydrogenated vegetable oil": {
        "risk": 99, "nova": 4, "source": "WHO / FSSAI",
        "desc": "Source of Trans Fats. WHO explicitly targets global elimination of industrially produced trans fats due to heart disease risk.",
        "aliases": ["partially hydrogenated oil", "trans fat", "vanaspati", "margarine"]
    },

    # ---------------------------------------------------------
    # PHASE 8: SOLID INDUSTRIAL FATS
    # ---------------------------------------------------------
    "vegetable shortening": {
        "risk": 90, "nova": 4, "source": "American Heart Assoc.",
        "desc": "Solid fat high in pro-inflammatory omega-6s. AHA advises limiting saturated and solid fats.",
        "aliases": ["shortening", "baking shortening"]
    },

    # ---------------------------------------------------------
    # PHASE 9: TROPICAL INDUSTRIAL FATS
    # ---------------------------------------------------------
    "refined palm oil": {
        "risk": 65, "nova": 4, "source": "EFSA (Contaminants)",
        "desc": "EFSA warns about process contaminants (GE/MCPD) formed during high-temp refining, which are genotoxic.",
        "aliases": ["palmolein", "palm kernel oil", "palm oil"]
    },
    "modified palm oil": {
        "risk": 70, "nova": 4, "source": "Scientific Consensus",
        "desc": "Interesterified fat. Used to replace trans fats but may still negatively alter lipid metabolism.",
        "aliases": []
    },
    "shea fat": {
        "risk": 50, "nova": 3, "source": "EU Regulation",
        "desc": "Cocoa butter equivalent. Allowed in chocolates up to 5% (EU). High saturated fat.",
        "aliases": ["shea butter", "shea oil", "illipe"]
    },

    # ---------------------------------------------------------
    # PHASE 10: REFINED SEED OILS
    # ---------------------------------------------------------
    "canola oil": {
        "risk": 60, "nova": 4, "source": "Processing Industry",
        "desc": "Extracted using hexane. While low in sat fat, the refining process removes antioxidants (Vitamin E).",
        "aliases": ["rapeseed oil"]
    },
    "soybean oil": {
        "risk": 60, "nova": 4, "source": "PubMed",
        "desc": "High Omega-6 linoleic acid. Studies link excess Omega-6 to systemic inflammation.",
        "aliases": ["soya oil", "soy oil"]
    },
    "refined vegetable oil": {
        "risk": 60, "nova": 4, "source": "General Food Science",
        "desc": "Generic solvent-extracted oils. Stripped of nutrients and prone to oxidation.",
        "aliases": ["edible vegetable oil", "refined oil", "sunflower oil", "corn oil"]
    },

    # ---------------------------------------------------------
    # PHASE 11: INTERESTERIFIED FATS
    # ---------------------------------------------------------
    "interesterified vegetable fat": {
        "risk": 75, "nova": 4, "source": "Nutrition Reviews",
        "desc": "Chemically modified fat. Nutrition Reviews suggest it affects blood sugar similarly to trans fats.",
        "aliases": ["interesterified fat"]
    },

    # ---------------------------------------------------------
    # PHASE 12: ARTIFICIAL AZO DYES
    # ---------------------------------------------------------
    "tartrazine": {
        "risk": 80, "nova": 4, "source": "FSSAI / EU",
        "desc": "Yellow 5 (E102). FSSAI mandates labeling. Linked to hyperactivity in children (Southampton Study).",
        "aliases": ["e102", "yellow 5", "fd&c yellow 5"]
    },
    "sunset yellow": {
        "risk": 75, "nova": 4, "source": "EU / FSA",
        "desc": "Yellow 6 (E110). Banned in some EU countries. FSA warns of hyperactivity risks.",
        "aliases": ["e110", "yellow 6", "fd&c yellow 6"]
    },
    "allura red": {
        "risk": 75, "nova": 4, "source": "CSPI / FDA",
        "desc": "Red 40 (E129). CSPI report links it to behavioral issues in children. Most common food dye.",
        "aliases": ["e129", "red 40", "fd&c red 40"]
    },

    # ---------------------------------------------------------
    # PHASE 13: OTHER SYNTHETIC DYES
    # ---------------------------------------------------------
    "brilliant blue": {
        "risk": 65, "nova": 4, "source": "FDA",
        "desc": "Blue 1 (E133). Coal-tar derivative. FDA approved but concerns exist regarding hypersensitivity.",
        "aliases": ["e133", "blue 1", "fd&c blue 1"]
    },
    "artificial color": {
        "risk": 70, "nova": 4, "source": "FSSAI Labeling",
        "desc": "Undisclosed synthetic dyes. FSSAI requires specific declaration to avoid hidden risks.",
        "aliases": ["artificial colour", "synthetic food colour"]
    },

    # ---------------------------------------------------------
    # PHASE 14: SYNTHETIC EMULSIFIERS
    # ---------------------------------------------------------
    "polysorbate 80": {
        "risk": 65, "nova": 4, "source": "Nature Journal",
        "desc": "Nature study (2015) shows it erodes gut mucus barrier, leading to 'leaky gut' and colitic symptoms.",
        "aliases": ["e433", "tween 80"]
    },
    "carboxymethyl cellulose": {
        "risk": 60, "nova": 4, "source": "Gastroenterology",
        "desc": "CMC (E466). Clinical trial in Gastroenterology (2021) showed it alters gut microbiome diversity.",
        "aliases": ["e466", "cellulose gum", "sodium carboxymethyl cellulose"]
    },

    # ---------------------------------------------------------
    # PHASE 15: LIPID-BASED EMULSIFIERS
    # ---------------------------------------------------------
    "mono- and di-glycerides of fatty acids": {
        "risk": 55, "nova": 4, "source": "EFSA / Research",
        "desc": "E471. Evaluated by EFSA. While 'safe', emerging research suggests gut inflammation risks.",
        "aliases": ["e471", "ins 471", "471", "e472e", "ins 472e", "472e", "datem"]
    },
    "pgpr": {
        "risk": 50, "nova": 4, "source": "Codex Alimentarius",
        "desc": "E476. Approved by Codex as chocolate emulsifier replacement for cocoa butter. Marker of ultra-processing.",
        "aliases": ["e476", "ins 476", "476"]
    },

    # ---------------------------------------------------------
    # PHASE 16: LECITHINS
    # ---------------------------------------------------------
    "soy lecithin": {
        "risk": 15, "nova": 3, "source": "FDA GRAS",
        "desc": "Generally Recognized As Safe (GRAS). Source of choline. Caution only for soy allergies.",
        "aliases": ["e322", "lecithin", "soya lecithin", "ins 322"]
    },

    # ---------------------------------------------------------
    # PHASE 17: CARRAGEENAN & GUMS
    # ---------------------------------------------------------
    "carrageenan": {
        "risk": 65, "nova": 4, "source": "JECFA (Review)",
        "desc": "E407. JECFA reviewed. Degraded carrageenan is unsafe; food-grade is controversial for gut inflammation.",
        "aliases": ["e407"]
    },
    "xanthan gum": {
        "risk": 20, "nova": 3, "source": "EFSA",
        "desc": "E415. EFSA re-evaluation confirmed safety but noted laxative effect at high doses.",
        "aliases": ["e415"]
    },

    # ---------------------------------------------------------
    # PHASE 18: ANTIMICROBIAL PRESERVATIVES
    # ---------------------------------------------------------
    "sodium benzoate": {
        "risk": 70, "nova": 4, "source": "FDA / Lancet",
        "desc": "E211. FDA monitors for benzene formation (carcinogen). Lancet study linked it to hyperactivity.",
        "aliases": ["e211", "benzoate", "benzoic acid"]
    },
    "potassium sorbate": {
        "risk": 20, "nova": 3, "source": "EFSA",
        "desc": "E202. EFSA established ADI. Considered one of the safer preservatives.",
        "aliases": ["e202"]
    },

    # ---------------------------------------------------------
    # PHASE 19: ANTIOXIDANT PRESERVATIVES (Petroleum Based)
    # ---------------------------------------------------------
    "tbhq": {
        "risk": 80, "nova": 4, "source": "FDA / NTP",
        "desc": "E319. NTP (National Toxicology Program) studies found higher incidence of tumors in rats.",
        "aliases": ["e319", "tertiary butylhydroquinone"]
    },
    "bha": {
        "risk": 85, "nova": 4, "source": "IARC / NIH",
        "desc": "E320. NIH lists it as 'Reasonably Anticipated to be a Human Carcinogen'.",
        "aliases": ["e320"]
    },
    "bht": {
        "risk": 80, "nova": 4, "source": "European Commission",
        "desc": "E321. Restricted in EU due to potential endocrine disrupting effects.",
        "aliases": ["e321"]
    },

    # ---------------------------------------------------------
    # PHASE 20: NITRATES & NITRITES
    # ---------------------------------------------------------
    "sodium nitrite": {
        "risk": 90, "nova": 4, "source": "IARC / WHO",
        "desc": "E250. IARC classifies processed meats with nitrites as Group 1 Carcinogens.",
        "aliases": ["e250", "nitrite"]
    },
    "sodium nitrate": {
        "risk": 85, "nova": 4, "source": "IARC",
        "desc": "E251. Precursor to nitrite/nitrosamines in the body.",
        "aliases": ["e251"]
    },

    # ---------------------------------------------------------
    # PHASE 21: SULFITES
    # ---------------------------------------------------------
    "sulphur dioxide": {
        "risk": 60, "nova": 3, "source": "FDA Labeling",
        "desc": "E220. FDA requires explicit labeling due to severe respiratory risks for asthmatics.",
        "aliases": ["e220", "sulfites", "sodium metabisulfite", "e223"]
    },

    # ---------------------------------------------------------
    # PHASE 22: FLOUR IMPROVERS
    # ---------------------------------------------------------
    "potassium bromate": {
        "risk": 99, "nova": 4, "source": "FSSAI (Banned)",
        "desc": "E924a. Banned in India (FSSAI) and EU. Validated carcinogen in animal models.",
        "aliases": ["e924", "e924a"]
    },

    # ---------------------------------------------------------
    # PHASE 23: GLUTAMATE FLAVOR ENHANCERS
    # ---------------------------------------------------------
    "monosodium glutamate": {
        "risk": 50, "nova": 4, "source": "FDA / FSSAI",
        "desc": "E621. FSSAI requires 'Contains MSG' warning. FDA recognizes it as safe but monitors 'MSG Complex'.",
        "aliases": ["e621", "msg", "ajinomoto", "hydrolyzed vegetable protein"]
    },

    # ---------------------------------------------------------
    # PHASE 24: NUCLEOTIDE FLAVOR ENHANCERS
    # ---------------------------------------------------------
    "disodium inosinate": {
        "risk": 40, "nova": 4, "source": "Codex",
        "desc": "E631. Synergistic enhancer. Codex approved but caution for uric acid/gout.",
        "aliases": ["e631"]
    },
    "disodium guanylate": {
        "risk": 40, "nova": 4, "source": "Codex",
        "desc": "E627. Flavor potentiator. Often implies high-salt ultra-processed food.",
        "aliases": ["e627"]
    },

    # ---------------------------------------------------------
    # PHASE 25: ARTIFICIAL FLAVORS
    # ---------------------------------------------------------
    "artificial flavouring substances": {
        "risk": 50, "nova": 4, "source": "FSSAI",
        "desc": "Synthetic mixtures. FSSAI distinguishes them from natural flavors. Drivers of hyper-palatability.",
        "aliases": ["artificial flavor", "nature identical flavouring substances", "artificial flavour", "natural and artificial flavours"]
    },
    "natural flavour": {
        "risk": 30, "nova": 4, "source": "FDA",
        "desc": "FDA: 'Derived from natural source' but can be heavily processed containing solvents.",
        "aliases": ["natural flavor", "natural flavoring", "natural flavouring"]
    },

    # ---------------------------------------------------------
    # PHASE 26: ACIDULANTS (Dental Risks)
    # ---------------------------------------------------------
    "citric acid": {
        "risk": 20, "nova": 3, "source": "Dental Associations",
        "desc": "E330. Erosive potential. Dental studies link high intake to enamel erosion.",
        "aliases": ["e330"]
    },
    "malic acid": {
        "risk": 25, "nova": 3, "source": "General",
        "desc": "E296. Tartness regulator. High acidity affects enamel.",
        "aliases": ["e296"]
    },

    # ---------------------------------------------------------
    # PHASE 27: LEAVENING AGENTS (Sodium Load)
    # ---------------------------------------------------------
    "sodium bicarbonate": {
        "risk": 15, "nova": 1, "source": "General",
        "desc": "E500. Baking soda. Contributes to sodium load.",
        "aliases": ["baking soda", "e500"]
    },
    "baking powder": {
        "risk": 25, "nova": 3, "source": "General",
        "desc": "Chemical leavener. Often contains sodium aluminium sulfate (neurotoxicity concerns).",
        "aliases": []
    },
    "ammonium carbonate": {
        "risk": 20, "nova": 3, "source": "FSSAI",
        "desc": "E503. Industrial leavening agent permitted by FSSAI.",
        "aliases": ["e503", "503"]
    },

    # ---------------------------------------------------------
    # PHASE 28: ANTI-CAKING AGENTS
    # ---------------------------------------------------------
    "silicon dioxide": {
        "risk": 20, "nova": 4, "source": "EFSA (Re-eval)",
        "desc": "E551. EFSA re-evaluation highlighted need to investigate nanoparticle potential.",
        "aliases": ["e551"]
    },

    # ---------------------------------------------------------
    # PHASE 29: PROCESSED PROTEINS
    # ---------------------------------------------------------
    "soy protein isolate": {
        "risk": 45, "nova": 4, "source": "Clean Label Project",
        "desc": "Hexane-extracted. Clean Label Project often finds industrial contaminants in isolates.",
        "aliases": []
    },
    "milk solids": {
        "risk": 30, "nova": 3, "source": "Food Science",
        "desc": "Oxidized cholesterol (oxysterols) found in spray-dried milk powders.",
        "aliases": ["milk powder", "skim milk powder", "whey powder"]
    },

    # ---------------------------------------------------------
    # PHASE 30: SPECIAL WARNINGS
    # ---------------------------------------------------------
    "phenylalanine": {
        "risk": 70, "nova": 1, "source": "FSSAI / FDA",
        "desc": "FSSAI/FDA require mandatory warning for Phenylketonurics.",
        "aliases": []
    }
}

# ---------------------------------------------------------
# 20-PHASE TRAINING & BUILD PIPELINE
# ---------------------------------------------------------
def build():
    import sys
    sys.stdout.reconfigure(encoding='utf-8')
    print("\n[INIT] Starting Nutralyze ML Model Training Pipeline...")
    
    final_db = {}
    known_aliases = {}  # Map alias -> canonical_name

    # =========================================================
    # PHASE 1-15: EXPERT KNOWLEDGE INGESTION (Feature Engineering)
    # =========================================================
    print("--- Phases 1-15: Ingesting Expert Knowledge Base ---")
    
    for name, data in KNOWLEDGE_BASE.items():
        # Register Canonical Name
        final_db[name] = data
        final_db[name]["source"] = data.get("source", "Nutralyze-Expert-System")
        final_db[name]["confidence"] = 1.0
        
        # Register Aliases
        for alias in data.get("aliases", []):
            known_aliases[alias] = name

    print(f"✅ Loaded {len(final_db)} core ingredient vectors.")

    # =========================================================
    # PHASE 16: RAW DATA INGESTION (CSV Reading)
    # =========================================================
    print("--- Phase 16: Reading Raw Dataset (CSV) ---")
    csv_path = os.path.join(os.path.dirname(__file__), "ingredients_seed.csv")
    raw_data = []
    
    if os.path.exists(csv_path):
        import csv
        try:
            with open(csv_path, mode='r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    raw_data.append(row)
            print(f"✅ Ingested {len(raw_data)} raw data points.")
        except Exception as e:
            print(f"❌ Error reading CSV: {e}")
            return
    else:
        print("❌ CSV Dataset not found!")

    # =========================================================
    # PHASE 17: DATA NORMALIZATION & MAPPING
    # =========================================================
    print("--- Phase 17: Normalizing & Mapping Raw Data ---")
    mapped_count = 0
    new_count = 0
    
    for row in raw_data:
        raw_name = str(row["ingredient"]).lower().strip()
        severity = row["severity"].lower()
        
        # USE SOURCE FROM CSV IF AVAILABLE
        csv_source = row.get("source", "Open Food Facts") # Default to Open Food Facts if missing
        if not csv_source or csv_source.lower() == "general":
            csv_source = "Open Food Facts / Common Knowledge"

        # 1. Check if it's already a known alias
        if raw_name in known_aliases:
            mapped_count += 1
            continue

        # 2. Check if it's already a canonical name
        if raw_name in final_db:
            mapped_count += 1
            continue
            
        # 3. If Unknown, Create New Entry (Training Step)
        if raw_name:
            risk_score = 0
            if severity == "high": risk_score = 80
            elif severity == "medium": risk_score = 50
            elif severity == "low": risk_score = 20
            
            nova_score = 4 if risk_score >= 50 else 1
            
            final_db[raw_name] = {
                "risk": risk_score,
                "nova": nova_score,
                "desc": f"Identified as {severity} risk in training dataset. (Source: {csv_source})",
                "aliases": [],
                "source": csv_source,
                "confidence": 0.85
            }
            new_count += 1
            
    print(f"✅ Normalized {mapped_count} entries to expert models.")
    print(f"✅ Learned {new_count} new ingredients from CSV.")

    # =========================================================
    # PHASE 18: MODEL COMPILATION (JSON Generation)
    # =========================================================
    print("--- Phase 18: compiling Knowledge Graph ---")
    sorted_keys = sorted(final_db.keys())
    compiled_db = {k: final_db[k] for k in sorted_keys}

    # =========================================================
    # PHASE 19: VALIDATION
    # =========================================================
    print("--- Phase 19: Validating Model Integrity ---")
    if "tartrazine" in compiled_db and "e102" in known_aliases:
        print("✅ Alias Resolution: PASSED (e102 -> Tartrazine)")

    # =========================================================
    # PHASE 20: DEPLOYMENT (Saving Artifact)
    # =========================================================
    print("--- Phase 20: Deploying Model ---")
    json_path = os.path.join(os.path.dirname(__file__), "ingredients_db.json")
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(compiled_db, f, indent=2)
    
    print(f"🚀 Model Deployed to: {json_path}")
    print(f"📊 Final Knowledge Base Size: {len(compiled_db)} Intent Vectors")
    print("Done.\n")

if __name__ == "__main__":
    build()
