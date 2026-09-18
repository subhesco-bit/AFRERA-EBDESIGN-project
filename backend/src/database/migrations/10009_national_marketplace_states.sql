BEGIN;
-- The original marketplace state dimension contained only North East seeds.
-- Extend its selectable supplier/buyer geography nationally. Codes are
-- internal stable keys; official names are sourced from the India Portal.
INSERT INTO states(name,code,region) VALUES
 ('Andhra Pradesh','AP','India'),('Arunachal Pradesh','AR','Northeast'),
 ('Assam','AS','Northeast'),('Bihar','BR','India'),
 ('Chhattisgarh','CG','India'),('Goa','GA','India'),
 ('Gujarat','GJ','India'),('Haryana','HR','India'),
 ('Himachal Pradesh','HP','India'),('Jharkhand','JH','India'),
 ('Karnataka','KA','India'),('Kerala','KL','India'),
 ('Madhya Pradesh','MP','India'),('Maharashtra','MH','India'),
 ('Manipur','MN','Northeast'),('Meghalaya','ML','Northeast'),
 ('Mizoram','MZ','Northeast'),('Nagaland','NL','Northeast'),
 ('Odisha','OD','India'),('Punjab','PB','India'),
 ('Rajasthan','RJ','India'),('Sikkim','SK','Northeast'),
 ('Tamil Nadu','TN','India'),('Telangana','TS','India'),
 ('Tripura','TR','Northeast'),('Uttar Pradesh','UP','India'),
 ('Uttarakhand','UK','India'),('West Bengal','WB','India'),
 ('Andaman and Nicobar Islands','AN','Union Territory'),
 ('Chandigarh','CH','Union Territory'),
 ('Dadra and Nagar Haveli and Daman and Diu','DD','Union Territory'),
 ('Delhi','DL','Union Territory'),
 ('Jammu and Kashmir','JK','Union Territory'),
 ('Lakshadweep','LD','Union Territory'),
 ('Puducherry','PY','Union Territory'),
 ('Ladakh','LA','Union Territory')
ON CONFLICT DO NOTHING;
COMMIT;
