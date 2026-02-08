SNOWFLAKE_SAMPLE_DATACREATE DATABASE IF NOT EXISTS menu_db;
USE DATABASE menu_db;

CREATE SCHEMA IF NOT EXISTS menu_data;
USE SCHEMA menu_data;

CREATE TABLE IF NOT EXISTS menu_items (
    id INTEGER AUTOINCREMENT,
    day STRING,
    residence STRING,
    meal_type STRING,
    item_name STRING,
    tags ARRAY,
    ingredients ARRAY,
    allergies ARRAY
);

INSERT INTO menu_items (day, residence, meal_type, item_name, tags, ingredients, allergies)
SELECT
    '2026-02-09', 'CMH', 'Hot Dish', 'Smoked Paprika Beef Goulash',
    ARRAY_CONSTRUCT('halal','no-dairy','no-gluten'),
    ARRAY_CONSTRUCT('Stewing beef','beef stock','marinara sauce','diced tomatoes','garlic','green pepper','red pepper','Spanish onion','pearl onion','canola oil','smoked paprika','parsley','bay leaf','corn starch'),
    ARRAY_CONSTRUCT()
UNION ALL
SELECT
    '2026-02-09', 'CMH', 'Hot Dish', 'Chicken Karaage',
    ARRAY_CONSTRUCT(),
    ARRAY_CONSTRUCT('Vegetable oil','cilantro','breaded chicken karaage','Zingy Kewpie (cooking wine, GF soy sauce, honey, Dijon mustard)','Japanese mayonnaise','green rice vinegar'),
    ARRAY_CONSTRUCT('egg','wheat','milk','mustard','soy','sulphites')
UNION ALL
SELECT
    '2026-02-09', 'CMH', 'Hot Dish', 'Vegetable Pad Thai',
    ARRAY_CONSTRUCT('vegan'),
    ARRAY_CONSTRUCT('Salt','black pepper','rice noodles','green onion','red pepper','bean sprouts','broccoli','garlic','ginger','cilantro','lime','corn starch','canola oil','sesame oil','Spanish onion','Deep Fried Tofu','vegetable soup base','chili paste','brown sugar','GF soy sauce','tamarind paste','corn starch'),
    ARRAY_CONSTRUCT()
UNION ALL
SELECT
    '2026-02-09', 'CMH', 'Hot Dish', 'Caprese chicken',
    ARRAY_CONSTRUCT('halal'),
    ARRAY_CONSTRUCT('chicken breast','pesto','Italiano seasoning','salt','pepper','canola oil','tomato','basil leaves','bocconcini','balsamic glaze'),
    ARRAY_CONSTRUCT()
UNION ALL
SELECT
    '2026-02-09', 'CMH', 'Hot Dish', 'Caponata',
    ARRAY_CONSTRUCT('vegan'),
    ARRAY_CONSTRUCT('Salt','black pepper','olive oil','Spanish onion','eggplant','green pepper','fire roasted tomatoes','red wine vinegar','celery','mint','chopped parsley','white wine','crushed red chili pepper','bay leaf','honey','raisins','green olives','capers'),
    ARRAY_CONSTRUCT()
UNION ALL
SELECT
    '2026-02-09', 'CMH', 'Hot Dish', 'Caprese chicken',
    ARRAY_CONSTRUCT('halal'),
    ARRAY_CONSTRUCT('chicken breast','pesto','Italiano seasoning','salt','pepper','canola oil','tomato','basil leaves','bocconcini','balsamic glaze'),
    ARRAY_CONSTRUCT('sulphites','soy','peanuts','tree nuts')
UNION ALL
SELECT
    '2026-02-09', 'CMH', 'Hot Dish', 'Italian sausage lasagna',
    ARRAY_CONSTRUCT(),
    ARRAY_CONSTRUCT('Pork Italian sausage','lasagna noodles','marinara sauce','cottage cheese','mozzarella cheese'),
    ARRAY_CONSTRUCT()
UNION ALL
SELECT
    '2026-02-09', 'CMH', 'Hot Dish', 'Porchetta',
    ARRAY_CONSTRUCT(),
    ARRAY_CONSTRUCT('Boneless Skinless Pork Belly','Black Pepper','Thyme','Rosemary','Sage','Olive Oil','Lemon','Chopped Garlic','Salt'),
    ARRAY_CONSTRUCT()
UNION ALL
SELECT
    '2026-02-09', 'V1', 'Hot Dish', 'Char Su Pork Loin',
    ARRAY_CONSTRUCT('no-dairy'),
    ARRAY_CONSTRUCT('Pork loin','hoisin sauce','glucose syrup','GF soy sauce','green rice vinegar','chili paste','sesame oil','Chinese 5 spice','ginger','garlic','lime juice','ketchup'),
    ARRAY_CONSTRUCT('soy','sesame','wheat','sulphites')
UNION ALL
SELECT
    '2026-02-09', 'V1', 'Hot Dish', 'Beef Korma',
    ARRAY_CONSTRUCT('halal','no-dairy'),
    ARRAY_CONSTRUCT('Stewing beef','Spanish onion','marinara sauce','garlic','beef stock','coconut milk','salt','corn starch','turmeric','cilantro','curry powder','canola oil','ginger','coriander','garam masala','cumin','black pepper'),
    ARRAY_CONSTRUCT('sulphites','gluten')
UNION ALL
SELECT
    '2026-02-09', 'V1', 'Hot Dish', 'Gyoza Vegetable Dumplings',
    ARRAY_CONSTRUCT('vegan','no-dairy'),
    ARRAY_CONSTRUCT('Vegetable dumplings','green onion','canola oil','sesame oil','teriyaki sauce'),
    ARRAY_CONSTRUCT('sesame','soy','wheat')
UNION ALL
SELECT
    '2026-02-09', 'V1', 'Hot Dish', 'Teriyaki Tempeh with Broccoli',
    ARRAY_CONSTRUCT('vegan','no-dairy'),
    ARRAY_CONSTRUCT('Tempeh','broccoli','teriyaki sauce','carrots','onion','sesame oil','olive oil','sesame seeds','garlic','ginger','salt','black pepper'),
    ARRAY_CONSTRUCT('sesame','soy','wheat')
UNION ALL
SELECT
    '2026-02-09', 'V1', 'Hot Dish', 'Lemon Pepper Spaghetti',
    ARRAY_CONSTRUCT('vegetarian'),
    ARRAY_CONSTRUCT('Spaghetti','olive oil','parmesan','parsley','salt','black pepper','lemon'),
    ARRAY_CONSTRUCT('milk','wheat')
UNION ALL
SELECT
    '2026-02-09', 'V1', 'Hot Dish', 'Sriracha Pork Belly',
    ARRAY_CONSTRUCT('no-dairy','no-gluten'),
    ARRAY_CONSTRUCT('Chinese 5 spice','sriracha','pork belly','garlic','honey','GF soy sauce'),
    ARRAY_CONSTRUCT('soy')
UNION ALL
SELECT
    '2026-02-09', 'V1', 'Hot Dish', 'Lemon Rosemary Chicken',
    ARRAY_CONSTRUCT('halal','no-dairy','no-gluten'),
    ARRAY_CONSTRUCT('Chicken breast','chicken stock','lemon juice','canola olive oil','garlic','rosemary','salt','black pepper','green onion','lemon pepper seasoning'),
    ARRAY_CONSTRUCT('sulphites')
UNION ALL
SELECT
    '2026-02-09', 'V1', 'Hot Dish', 'Spanakopita Swirl',
    ARRAY_CONSTRUCT('vegetarian'),
    ARRAY_CONSTRUCT('unbleached wheat flour','filtered water','canola oil','non-hydrogenated vegetable shortening','sugar','salt','corn starch','L-Cysteine','spinach','ricotta cheese','feta cheese','onions','canola oil','durum semolina','salt','dill','methylcellulose','black pepper'),
    ARRAY_CONSTRUCT('milk','wheat')
UNION ALL
SELECT
    '2026-02-09', 'V1', 'Hot Dish', 'Chipotle sweet potato, chickpea, and tofu',
    ARRAY_CONSTRUCT('no-dairy','no-gluten','vegan'),
    ARRAY_CONSTRUCT('Extra firm tofu','sweet potato','chickpeas','chipotle pepper in adobe','garlic powder','onion powder','paprika','salt','black pepper','cilantro','vegan mayonnaise','jalapeno pepper','garlic','apple cider vinegar','lime juice','salt','black pepper','cilantro','canola olive oil'),
    ARRAY_CONSTRUCT('soy','sulphite')
UNION ALL
SELECT
    '2026-02-09', 'V1', 'Hot Dish', 'Penne with Lentil Vegetable Bolognese',
    ARRAY_CONSTRUCT('no-dairy','vegan'),
    ARRAY_CONSTRUCT('Penne pasta','diced tomatoes','red lentils','celery','onion','marinara sauce','vegetable stock','tomato paste','garlic','white mushroom','oregano','thyme','canola and olive oil','salt','black pepper','parsley','vegan cheese','basil','balsamic glaze','balsamic vinegar'),
    ARRAY_CONSTRUCT('wheat','peanuts','tree nuts','sesame','soy','sulphites');

SELECT * FROM menu_items;

CREATE USER IF NOT EXISTS teammate
PASSWORD = 'TEMP_PASSWORD_!2!'
DEFAULT_ROLE = PUBLIC;
GRANT USAGE ON WAREHOUSE COMPUTE_WH TO USER teammate;
GRANT USAGE ON DATABASE menu_db TO USER teammate;
GRANT USAGE ON SCHEMA menu_db.menu_data TO USER teammate;
GRANT ROLE SYSADMIN TO USER teammate;
