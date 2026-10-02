-- Initial schema: customers, catalogue, orders and reviews.
-- Money is stored in cents (integers) so totals never pick up rounding errors.

CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text NOT NULL,
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id          serial PRIMARY KEY,
  slug        text NOT NULL UNIQUE,
  name        text NOT NULL,
  description text NOT NULL DEFAULT '',
  position    integer NOT NULL DEFAULT 0
);

CREATE TABLE products (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug             text NOT NULL UNIQUE,
  name             text NOT NULL,
  brand            text NOT NULL DEFAULT '',
  description      text NOT NULL DEFAULT '',
  price_cents      integer NOT NULL CHECK (price_cents >= 0),
  -- The "was" price shown crossed out when a sofa is on sale.
  compare_at_cents integer CHECK (compare_at_cents IS NULL OR compare_at_cents > price_cents),
  stock            integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  image            text NOT NULL,
  material         text,
  color            text,
  seats            integer CHECK (seats IS NULL OR seats > 0),
  width_cm         integer,
  depth_cm         integer,
  height_cm        integer,
  is_active        boolean NOT NULL DEFAULT true,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE product_categories (
  product_id  uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  category_id integer NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (product_id, category_id)
);
CREATE INDEX product_categories_category_idx ON product_categories (category_id);

-- Product photos uploaded from the admin panel, served by /api/images/[id].
CREATE TABLE images (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  content_type text NOT NULL,
  data         bytea NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orders (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES users(id),
  email             text NOT NULL,
  name              text NOT NULL,
  address           text NOT NULL,
  phone             text NOT NULL,
  amount_cents      integer NOT NULL CHECK (amount_cents >= 0),
  status            text NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending', 'paid', 'shipped', 'delivered', 'cancelled')),
  card_brand        text,
  card_last4        text,
  payment_intent_id text UNIQUE,
  refunded          boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX orders_user_idx ON orders (user_id, created_at DESC);

CREATE TABLE order_items (
  id          serial PRIMARY KEY,
  order_id    uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  -- Kept nullable so old orders survive a product being deleted; name and price are copied.
  product_id  uuid REFERENCES products(id) ON DELETE SET NULL,
  name        text NOT NULL,
  unit_amount integer NOT NULL CHECK (unit_amount >= 0),
  quantity    integer NOT NULL CHECK (quantity > 0)
);
CREATE INDEX order_items_order_idx ON order_items (order_id);
CREATE INDEX order_items_product_idx ON order_items (product_id);

CREATE TABLE reviews (
  id         serial PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating     smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title      text NOT NULL DEFAULT '',
  body       text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
