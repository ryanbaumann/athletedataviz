SELECT 
first_name "First Name",
last_name "Last Name",
email "Email", 
'' as "Company", 
'' as "Address1",
'' as "Address2",
city as "City", 
'' as "Province",
'' as "Province Code",
country as "Country", 
'' as "Country Code",
'' as "Zip",
'' as "Phone",
'yes' as "Accepts Marketing",
'' as "Total Spent",
'' as "Total Orders",
'' as "Tags",
'Import from ADV Login' as "Note",
'' as "Tax Exempt"

FROM public."Athlete";
