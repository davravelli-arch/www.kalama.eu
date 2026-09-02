U = "https://images.unsplash.com/"
TF = "https://cdn.thefork.com/tf-lab/image/upload/w_640,c_fill,q_auto,f_auto/restaurant/8d038508-d588-47fb-a095-fd0e9d912f32/"
MG = "https://images.myguide-cdn.com/malaga/companies/kalama-malaga-seafood-bar/large/"

MENU_VERSION = "2025-menu-malaga-malta-v2"


def u(photo_id):
    return f"{U}{photo_id}?q=80&w=800&auto=format&fit=crop"


IMG = {
    "melanzane": "",
    "polpo": "",
    "scialatielli": "",
    "orecchiette": "",
    "strozzapreti": "",
    "calamari_s": MG + "kalama-malaga-seafood-bar-2-7495722.jpg",
    "calamari_l": TF + "4a45016f-eeb4-4c62-b24d-7ee8ecfc46b8.png",
    "calamari_zucchine": TF + "5b6ddc1e-6ea8-4a24-9283-bc18ccc9ce0c.png",
    "calamari_gamberi": "",
    "gamberi": TF + "ec864289-8335-49ea-ad30-157c7f207b5e.png",
    "fritto": TF + "b0bd03e5-a835-4645-85c3-1ec8c5ec9058.png",
    "crocchette": TF + "747086b1-0a2c-4b72-99f6-970f01b4b9a0.png",
    "fishchips": "",
    "patatine": "",
    "zucchine": "",
    "spiedini": "",
    "orata": "",
    "salmone": MG + "kalama-malaga-seafood-bar-4-7495724.jpg",
    "pescespada": "",
    "tonno_grill": "",
    "tartare": "",
    "tuna_salad": "",
    "mista": "",
    "italiana": TF + "0baa8f03-0cc8-4296-9776-05381fcb6e62.png",
    "catalana": "",
    "polpo_salad": "",
    "comino": TF + "da7c05ce-7bd0-4b49-b8b3-572178668d08.png",
    "gozo": MG + "kalama-malaga-seafood-bar-1-7495721.jpg",
    "capri": TF + "8f4295b4-bd0a-4795-9fe1-0ce99150127e.png",
    "focaccia": "",
    "tiramisu": "",
}


def item(loc, cat, id_, name_it, name_en, price, desc_it="", desc_en="", img=None, tag_it="", tag_en="", price_max=None):
    return {
        "id": f"{loc}-{id_}", "location": loc, "category": cat,
        "name_it": name_it, "name_en": name_en,
        "desc_it": desc_it, "desc_en": desc_en,
        "price": price, "price_max": price_max,
        "tag_it": tag_it, "tag_en": tag_en,
        "image": IMG.get(img, "") if img else "",
    }


M = "malaga"
MALAGA = [
    # Dalla cucina
    item(M, "cucina", "melanzane-classica", "Melanzane alla Parmigiana Classica", "Classic Eggplant Parmigiana", 12.0,
         "Melanzane, salsa di pomodoro, basilico, provola e parmigiano.", "Aubergine, tomato sauce, basil, provola and parmesan.", "melanzane"),
    item(M, "cucina", "melanzane-acciughe", "Melanzane alla Parmigiana con Acciughe", "Eggplant Parmigiana with Anchovies", 15.0,
         "Melanzane, salsa di pomodoro, basilico, mozzarella, provola, parmigiano e acciughe.", "Aubergine, tomato sauce, basil, mozzarella, provola, parmesan and anchovies.", "melanzane"),
    item(M, "cucina", "polpo-luciana", "Polpo alla Luciana", "Octopus Luciana Style", 18.0,
         "Polpo, vino bianco, salsa di pomodoro, pomodorini, olive, capperi e prezzemolo, su letto di patate saltate.",
         "Octopus, white wine, tomato sauce, cherry tomatoes, olives, capers and parsley over sautéed potatoes.", "polpo"),
    # La pasta
    item(M, "pasta", "scialatielli", "Scialatielli alla Puttanesca con Pesce Fresco", "Scialatielli Puttanesca with Fresh Fish", 15.0,
         "Pasta fresca, pesce fresco, pomodorini, olive, capperi, prezzemolo e aglio.", "Fresh pasta, fresh fish, cherry tomatoes, olives, capers, parsley and garlic.", "scialatielli"),
    item(M, "pasta", "orecchiette", "Orecchiette con Broccoli e Acciughe", "Orecchiette with Broccoli & Anchovies", 14.5,
         "Pasta fresca, broccoli, acciughe sott'olio, aglio, prezzemolo e olio extravergine di oliva.", "Fresh pasta, broccoli, anchovies in oil, garlic, parsley and extra virgin olive oil.", "orecchiette"),
    item(M, "pasta", "strozzapreti", "Strozzapreti con Gamberi e Zucchine", "Strozzapreti with Prawns & Zucchini", 16.0,
         "Pasta fresca con gamberi e zucchine.", "Fresh pasta with prawns and zucchini.", "strozzapreti"),
    # Dalla friggitrice
    item(M, "fritti", "calamari-piccoli", "Calamari Fritti Piccoli (150 g)", "Fried Calamari Small (150 g)", 11.0, img="calamari_s"),
    item(M, "fritti", "calamari-grandi", "Calamari Fritti Grandi (250 g)", "Fried Calamari Large (250 g)", 14.0, img="calamari_l"),
    item(M, "fritti", "calamari-zucchine", "Calamari e Zucchine Fritte", "Fried Calamari & Zucchini", 14.0, img="calamari_zucchine"),
    item(M, "fritti", "calamari-kg", "1 kg di Calamari Fritti", "1 kg of Fried Calamari", 50.0, img="fritto", tag_it="Da condividere", tag_en="To share"),
    item(M, "fritti", "calamari-gamberi", "Calamari e Gamberi Fritti", "Fried Calamari & Prawns", 16.0, img="calamari_gamberi"),
    item(M, "fritti", "gamberi-fritti", "Gamberi Fritti (8 gamberi)", "Fried Prawns (8 prawns)", 18.0, img="gamberi"),
    item(M, "fritti", "gran-fritto", "Gran Fritto Misto", "Grand Mixed Fry", 32.0,
         "Calamari, zucchine, gamberi, baccalà, bianchetti, polpo, scorfano.", "Calamari, zucchini, prawns, cod, whitebait, octopus, scorpion fish.", "fritto", "Da condividere", "To share"),
    item(M, "fritti", "crocchette", "Crocchette di Baccalà e Patate (5)", "Cod & Potato Croquettes (5)", 10.0, img="crocchette"),
    item(M, "fritti", "fish-chips", "Fish and Chips (baccalà)", "Fish and Chips (cod)", 14.0, img="fishchips"),
    item(M, "fritti", "patatine", "Patatine Fritte", "French Fries", 4.5, img="patatine"),
    item(M, "fritti", "zucchine-fritte", "Zucchine Fritte", "Fried Zucchini", 4.5, img="zucchine"),
    # Dalla griglia
    item(M, "grill", "spiedini-calamari", "Spiedini di Calamari (3)", "Calamari Skewers (3)", 13.0, img="spiedini"),
    item(M, "grill", "spiedini-calamari-gamberi", "Spiedini di Calamari e Gamberi (2)", "Calamari & Prawn Skewers (2)", 14.0, img="spiedini"),
    item(M, "grill", "spiedini-gamberi", "Spiedini di Gamberi (8)", "Prawn Skewers (8)", 18.0, img="gamberi"),
    item(M, "grill", "orata", "Orata alla Griglia", "Grilled Sea Bream", 18.0, "Con patatine e insalata.", "With fries and salad.", "orata"),
    item(M, "grill", "salmone", "Salmone alla Griglia", "Grilled Salmon", 18.0, "Con patatine e insalata.", "With fries and salad.", "salmone"),
    # Salse
    item(M, "salse", "maionese", "Maionese", "Mayonnaise", 1.0, "Una salsa è inclusa con ogni piatto.", "One sauce is included with every dish."),
    item(M, "salse", "aglio-peperoncino", "Aglio e Peperoncino", "Garlic & Chilli", 1.0, "Una salsa è inclusa con ogni piatto.", "One sauce is included with every dish."),
    item(M, "salse", "aneto-lime", "Aneto e Lime", "Dill & Lime", 1.0, "Una salsa è inclusa con ogni piatto.", "One sauce is included with every dish."),
    item(M, "salse", "tartara", "Tartara", "Tartare Sauce", 1.0, "Una salsa è inclusa con ogni piatto.", "One sauce is included with every dish."),
    # Le insalate
    item(M, "insalate", "insalata-mista", "Insalata Mista", "Mixed Salad", 5.0,
         "Insalata verde, pomodorini, rucola, olive verdi, cipolla rossa.", "Green salad, cherry tomatoes, rocket, green olives, red onion.", "mista"),
    item(M, "insalate", "insalata-italiana", "Insalata all'Italiana", "Italian Salad", 12.0,
         "Gamberi, gamberone, tonno, cetriolo e piselli.", "Prawns, king prawn, tuna, cucumber and peas.", "italiana"),
    item(M, "insalate", "insalata-catalana", "Insalata Catalana", "Catalan Salad", 18.0,
         "Polpo tenero, gamberone, calamari, pomodorini, cipolla rossa, patate lesse, basilico, sedano, carota, olio EVO e limone.",
         "Tender octopus, king prawn, calamari, cherry tomatoes, red onion, boiled potatoes, basil, celery, carrot, EVO oil and lemon.", "catalana"),
    item(M, "insalate", "insalata-polpo", "Insalata di Polpo", "Octopus Salad", 16.0,
         "Polpo tenero, patate lesse, prezzemolo, aglio, pomodori secchi, sedano, cetriolini sott'olio e salsa al limone.",
         "Tender octopus, boiled potatoes, parsley, garlic, sun-dried tomatoes, celery, pickled gherkins and lemon dressing.", "polpo_salad"),
    # I panini
    item(M, "panini", "comino", "Panino Comino", "Comino Sandwich", 15.0,
         "Tonno fresco alla griglia, peperoni arrostiti, pomodorini caramellati, rucola e salsa della casa.",
         "Grilled fresh tuna, roasted peppers, caramelised cherry tomatoes, rocket and house sauce.", "comino"),
    item(M, "panini", "gozo", "Panino Gozo", "Gozo Sandwich", 15.0,
         "Polpo tenero alla griglia, pomodori secchi, stracciatella, rucola e salsa della casa.",
         "Grilled tender octopus, sun-dried tomatoes, stracciatella, rocket and house sauce.", "gozo", "Più amato", "Best seller"),
    item(M, "panini", "capri", "Panino Capri", "Capri Sandwich", 15.0,
         "Calamari alla griglia, melanzane grigliate, Philadelphia, hummus e insalata.",
         "Grilled calamari, grilled aubergine, Philadelphia, hummus and salad.", "capri"),
    item(M, "panini", "focaccia", "Focaccia con Olio EVO e Rosmarino", "Focaccia with EVO Oil & Rosemary", 5.0, img="focaccia"),
    # Dolce
    item(M, "dolci", "tiramisu", "Tiramisù Classico", "Classic Tiramisù", 5.0, img="tiramisu"),
    # Bevande
    item(M, "bevande", "coca-cola", "Coca-Cola", "Coca-Cola", 3.0),
    item(M, "bevande", "coca-cola-zero", "Coca-Cola Zero", "Coca-Cola Zero", 3.0),
    item(M, "bevande", "fanta-arancia", "Fanta Arancia", "Fanta Orange", 3.0),
    item(M, "bevande", "fanta-limone", "Fanta Limone", "Fanta Lemon", 3.0),
    item(M, "bevande", "fuze-limone", "Fuze Tea Limone", "Fuze Tea Lemon", 3.0),
    item(M, "bevande", "fuze-pesca", "Fuze Tea Pesca", "Fuze Tea Peach", 3.0),
    # Birre
    item(M, "birre", "victoria-250", "Victoria 250 ml", "Victoria 250 ml", 3.0),
    item(M, "birre", "victoria-330", "Victoria 330 ml", "Victoria 330 ml", 3.5),
    item(M, "birre", "victoria-500", "Victoria 500 ml", "Victoria 500 ml", 4.8),
    item(M, "birre", "victoria-00", "Victoria 0,0% (bottiglia)", "Victoria 0.0% (bottle)", 3.5),
    # Vini (calice / bottiglia)
    item(M, "vini", "chardonnay-cavit", "Chardonnay Cavit", "Chardonnay Cavit", 4.5, "Bianco · calice / bottiglia", "White · glass / bottle", price_max=22.0),
    item(M, "vini", "pinot-grigio", "Pinot Grigio Terre di Rai", "Pinot Grigio Terre di Rai", 4.5, "Bianco · calice / bottiglia", "White · glass / bottle", price_max=22.0),
    item(M, "vini", "sauvignon", "Sauvignon Grigio Terre di Rai", "Sauvignon Grigio Terre di Rai", 4.5, "Bianco · calice / bottiglia", "White · glass / bottle", price_max=22.0),
    item(M, "vini", "prosecco-reguta", "Prosecco Reguta", "Prosecco Reguta", 5.5, "Bianco · calice / bottiglia", "White · glass / bottle", price_max=25.0),
    item(M, "vini", "rose-pinot-blush", "Rosé Pinot Blush Terre di Rai", "Rosé Pinot Blush Terre di Rai", 4.5, "Rosato · calice / bottiglia", "Rosé · glass / bottle", price_max=22.0),
    item(M, "vini", "cerasuolo", "Cerasuolo Ciavolich", "Cerasuolo Ciavolich", 4.5, "Rosato · calice / bottiglia", "Rosé · glass / bottle", price_max=25.0),
    item(M, "vini", "chianti", "Chianti Castiglioni", "Chianti Castiglioni", 5.0, "Rosso · calice / bottiglia", "Red · glass / bottle", price_max=28.0),
    item(M, "vini", "tinto-verano", "Tinto de Verano", "Tinto de Verano", 5.0, "Rosso · calice", "Red · glass"),
    # Cocktail
    item(M, "cocktail", "spritz", "Spritz", "Spritz", 7.0),
    item(M, "cocktail", "mojito", "Mojito", "Mojito", 7.0),
    item(M, "cocktail", "daiquiri", "Daiquiri", "Daiquiri", 7.0),
    item(M, "cocktail", "tinto-verano", "Tinto de Verano", "Tinto de Verano", 5.0, "Bicchiere / caraffa", "Glass / jug", price_max=15.0),
    item(M, "cocktail", "sangria", "Sangria", "Sangria", 6.0, "Bicchiere / caraffa", "Glass / jug", price_max=20.0),
    # Caffè
    item(M, "caffe", "espresso", "Caffè Espresso", "Espresso", 2.0),
    item(M, "caffe", "americano", "Caffè Americano", "Americano", 2.5),
    item(M, "caffe", "cappuccino", "Cappuccino", "Cappuccino", 3.0),
]

T = "malta"
MALTA = [
    # From the kitchen
    item(T, "cucina", "melanzane-classica", "Melanzane alla Parmigiana Classica", "Classic Eggplant Parmigiana", 11.0,
         "Melanzane, salsa di pomodoro, basilico, mozzarella, Parmigiano Reggiano e provola.", "Aubergine, tomato sauce, basil, mozzarella, Parmigiano Reggiano and provola.", "melanzane"),
    item(T, "cucina", "melanzane-pesce", "Melanzane alla Parmigiana con Pesce", "Eggplant Parmigiana with Fish", 14.0,
         "Melanzane, salsa di pomodoro, basilico, mozzarella, Parmigiano Reggiano, provola, pesce fresco e olive.",
         "Aubergine, tomato sauce, basil, mozzarella, Parmigiano Reggiano, provola, fresh fish and olives.", "melanzane"),
    item(T, "cucina", "polpo-luciana", "Polpo alla Luciana", "Octopus Luciana Style", 16.0,
         "Polpo, vino bianco, salsa di pomodoro, olive, capperi, prezzemolo, su letto di patate saltate.",
         "Octopus, white wine, tomato sauce, olives, capers, parsley, on a bed of sautéed potatoes.", "polpo"),
    item(T, "cucina", "tartare", "Tartare di Salmone o Tonno", "Salmon or Tuna Tartare", 15.0, img="tartare"),
    item(T, "cucina", "teriyaki-tuna-salad", "Insalata di Tonno Teriyaki", "Teriyaki Tuna Salad", 15.0,
         "Tonno fresco, insalata fresca, maionese teriyaki Kalamà, ravanelli, pomodorini gialli, mandorle tostate.",
         "Fresh tuna, fresh salad, Kalamà teriyaki mayo, radish, yellow cherry tomatoes, toasted almonds.", "tuna_salad"),
    item(T, "cucina", "insalata-polpo", "Insalata di Polpo e Patate", "Octopus & Potato Salad", 15.0,
         "Polpo, patate, sedano, pomodorini rossi e gialli, olio, olive, prezzemolo, limone.",
         "Octopus, potatoes, celery, red and yellow cherry tomatoes, oil, olives, parsley, lemon.", "polpo_salad"),
    # From the fryer
    item(T, "fritti", "calamari-grandi", "Calamari Fritti Grandi (250 g)", "Fried Calamari Large (250 g)", 13.0, img="calamari_l"),
    item(T, "fritti", "calamari-piccoli", "Calamari Fritti Piccoli (150 g)", "Fried Calamari Small (150 g)", 10.0, img="calamari_s"),
    item(T, "fritti", "calamari-zucchine", "Calamari e Zucchine Fritte", "Fried Calamari & Zucchini", 12.0, img="calamari_zucchine"),
    item(T, "fritti", "calamari-kg", "1 kg di Calamari Fritti", "1 KILO of Fried Calamari", 48.0, img="fritto", tag_it="Da condividere", tag_en="To share"),
    item(T, "fritti", "calamari-gamberi", "Calamari e Gamberi Fritti", "Fried Calamari & Prawns", 15.0, img="calamari_gamberi"),
    item(T, "fritti", "gamberi-fritti", "Gamberi Fritti (8 gamberoni)", "Fried Prawns (8 large prawns)", 18.0, img="gamberi"),
    item(T, "fritti", "great-mix", "Great Mix", "Great Mix", 26.0,
         "Calamari, zucchine, 2 gamberi, 2 filetti di baccalà, 2 frittelle di neonata, 2 polpette di pesce, 6 cozze.",
         "Calamari, zucchini, 2 prawns, 2 cod fillets, 2 neonata cakes, 2 fish balls, 6 mussels.", "fritto", "Da condividere", "To share"),
    item(T, "fritti", "neonata-cakes", "Frittelle di Neonata (4)", "Neonata Cakes (4 cakes)", 10.0, img="crocchette"),
    item(T, "fritti", "fish-balls", "Polpette di Pesce (5)", "Fish Balls (5 balls)", 10.0, img="crocchette"),
    item(T, "fritti", "fish-chips", "Fish and Chips (baccalà)", "Fish and Chips (cod fish)", 12.0, img="fishchips"),
    item(T, "fritti", "zucchine-fritte", "Zucchine Fritte", "Zucchini (courgettes)", 4.0, img="zucchine"),
    item(T, "fritti", "patatine", "Patatine Fritte", "French Fries (chips)", 4.0, img="patatine"),
    # From the grill
    item(T, "grill", "spiedini-calamari", "Spiedini di Calamari (3)", "Calamari Skewers (3)", 12.0, img="spiedini"),
    item(T, "grill", "spiedini-calamari-gamberi", "Spiedini di Calamari e Gamberi (2)", "Calamari & Prawn Skewers (2)", 14.0, img="spiedini"),
    item(T, "grill", "spiedini-gamberi", "Spiedini di Gamberi (8 gamberoni)", "Prawn Skewers (8 large prawns)", 18.0, img="gamberi"),
    item(T, "grill", "pesce-spada", "Pesce Spada alla Griglia", "Grilled Swordfish", 18.0, "Con patatine e insalata.", "Chips and salad.", "pescespada"),
    item(T, "grill", "salmone", "Salmone alla Griglia", "Grilled Salmon", 16.0, "Con patatine e insalata.", "Chips and salad.", "salmone"),
    item(T, "grill", "tonno", "Tonno Locale alla Griglia", "Grilled Local Tuna", 18.0, "Con patatine e insalata.", "Chips and salad.", "tonno_grill"),
    # Sandwiches
    item(T, "panini", "comino", "Comino Sandwich", "Comino Sandwich", 15.0,
         "Tagliata di tonno alla griglia, peperoni arrostiti, pomodorini caramellati, rucola, salsa della casa.",
         "Grilled tuna tagliata, roasted bell pepper, caramelized cherry tomatoes, rucola, homemade sauce.", "comino"),
    item(T, "panini", "gozo", "Gozo Sandwich", "Gozo Sandwich", 15.0,
         "Polpo tenero alla griglia, pomodori secchi, stracciatella, rucola, salsa della casa.",
         "Grilled tender octopus, dry tomatoes, stracciatella cheese, rucola, homemade sauce.", "gozo", "Più amato", "Best seller"),
    item(T, "panini", "capri", "Capri Sandwich", "Capri Sandwich", 14.0,
         "Calamari alla griglia, melanzane grigliate, Philadelphia, hummus, insalata.",
         "Grilled calamari, grilled aubergines, Philadelphia cheese, hummus, salad.", "capri"),
    # Dessert
    item(T, "dolci", "tiramisu", "Tiramisù Classico", "Classic Tiramisù", 5.0, img="tiramisu"),
    # Hot drinks
    item(T, "caffe", "espresso", "Caffè Espresso", "Espresso", 1.5),
    # Cold drinks
    item(T, "bevande", "soft-drinks", "Bibite", "Soft Drinks", 2.5),
    item(T, "bevande", "fuze-tea", "Fuze Tea", "Fuze Tea", 3.0),
    item(T, "bevande", "lurisia", "Lurisia", "Lurisia", 3.5, "Aranciata, limonata, gazzosa.", "Orange, lemonade, gazzosa."),
    item(T, "bevande", "schweppes", "Schweppes 50 cl", "Schweppes 50cl", 3.5),
    item(T, "bevande", "acqua-frizzante", "Acqua Frizzante 50 cl", "Sparkling Water 50 cl", 1.5),
    item(T, "bevande", "acqua-naturale", "Acqua Naturale 50 cl", "Still Water 50 cl", 1.5),
    # Beers
    item(T, "birre", "cisk-33", "Cisk 33 cl", "Cisk 33cl", 3.0),
    item(T, "birre", "cisk-zero", "Cisk Zero 33 cl", "Cisk Zero 33cl", 3.0),
    item(T, "birre", "cisk-lemon", "Cisk Lemon 33 cl", "Cisk Lemon 33cl", 3.5),
    item(T, "birre", "cisk-50", "Cisk 50 cl", "Cisk 50cl", 4.0),
    item(T, "birre", "corona", "Corona 33 cl", "Corona 33cl", 4.0),
    # Wine (glass / bottle)
    item(T, "vini", "chardonnay-casalforte", "Chardonnay Casalforte", "White Chardonnay (Casalforte)", 5.0, "Bianco · calice / bottiglia", "White · glass / bottle", price_max=22.0),
    item(T, "vini", "rose-negroamaro", "Rosé di Negroamaro Giustini", "Rosé di Negroamaro (Giustini)", 6.0, "Rosato · calice / bottiglia", "Rosé · glass / bottle", price_max=28.0),
    item(T, "vini", "primitivo", "Primitivo Giustini", "Red Primitivo (Giustini)", 6.0, "Rosso · calice / bottiglia", "Red · glass / bottle", price_max=28.0),
    item(T, "vini", "prosecco-falcieri", "Prosecco Falcieri", "Prosecco (Falcieri)", 5.5, "Calice / bottiglia", "Glass / bottle", price_max=25.0),
]

MENU_SEED = MALAGA + MALTA
