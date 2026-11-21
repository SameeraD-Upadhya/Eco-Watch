# Authoritative Sources & Administrative Structure for Mysuru

This document records the official jurisdictional structure, administrative zones, wards, and civic statutory authorities for the City of Mysuru (Karnataka, India), utilized by the EcoWatch civic incident simulation platform.

---

## 1. Statutory Delimitation & Corporation Status in Force

### 1.1 In-Force Structure: Mysuru City Corporation (MCC) 65 Wards
- **Statutory Authority:** Mysuru City Corporation (MCC) / Directorate of Municipal Administration, Government of Karnataka.
- **Enabling Notification:** Urban Development Department Delimitation Notification & Karnataka State Election Commission Gazette (February 2018), formulated under Sections 11 and 13 of the Karnataka Municipal Corporations Act, 1976.
- **Effective Term:** In force from the September 2018 municipal elections through the present day.
- **Scope & Division:** Exactly **65 notified wards** numbered contiguously from **Ward 1 (Hebballu – Lakshmikantha Nagara)** to **Ward 65 (Srirampura)**.
- **Administrative Revenue Zones:** 9 designated administrative zones (Zone 1 through Zone 9), operating through zonal offices located in Agrahara, Krishnamurthipuram, Gokulam, Chamaraja, Vijayanagar, Bannimantap, N.R. Mohalla, Sathagalli, and Gayatripuram.
- **Official Source URL:** [Mysuru District Administration – Elections Portal](https://mysore.nic.in/en/document-category/elections/)
- **Retrieved On:** 2026-11-21

### 1.2 Proposed Greater Mysuru (Bruhat Mysuru Mahanagara Palike) Status
- **Preliminary Notification Date:** January 8 / 9, 2026 (Published in the Karnataka State Gazette by the Urban Development Department under Sections 3 and 4 of KMC Act 1976).
- **Proposed Area:** Expansion from 86.31 sq. km to 341.44 sq. km by merging existing MCC (65 wards), Hootagalli City Municipal Council (CMC), 4 Town Panchayats (Srirampura, Bogadi, Rammanahalli, Kadakola), and Chamundi Hill Gram Panchayat.
- **Current Legal Status:** The January 2026 notification is a **preliminary draft notification** inviting public objections and claims within 30 days. No new municipal ward delimitation or council formation has been gazetted.
- **Application Standard:** EcoWatch strictly implements the **currently in-force 65-ward MCC structure**. Independent local bodies such as the Hootagalli City Municipal Council (CMC) are excluded from the MCC master dataset to preserve administrative truth.

---

## 2. Statutory Civic Authorities in Mysuru

The following 5 public bodies hold statutory responsibility for civic infrastructure, environmental quality, and public sanitation in Mysuru:

| Authority Name | Short Name | Jurisdictional Scope | Official Portal |
|---|---|---|---|
| **Mysuru City Corporation** | MCC | Municipal solid waste, underground drainage (UGD), stormwater drains, public sanitation, road maintenance, and ward-level civil works across 65 wards. | [mysurucitycorporation.co.in](https://mysurucitycorporation.co.in/) |
| **Karnataka State Pollution Control Board** | KSPCB | Air quality indices (AQI), industrial effluent compliance in Hebbal industrial clusters, ambient noise standards. | [kspcb.karnataka.gov.in](https://kspcb.karnataka.gov.in/) |
| **Mysuru Urban Development Authority** | MUDA | Master plan layout sanctioning, civic amenity preservation, urban lake desilting and conservation (Kukkarahalli, Lingambudhi). | [muda.karnataka.gov.in](https://muda.karnataka.gov.in/) |
| **Chamundeshwari Electricity Supply Corporation** | CHESCOM | Electric distribution reliability, public illumination safety, high-tension wire clearances, and transformer buffer zones. | [chescom.karnataka.gov.in](https://chescom.karnataka.gov.in/) |
| **Karnataka Forest Department** | Forest Dept | Hazardous roadside tree canopy pruning, storm-fallen branch clearance, Chamundi Hill conservation buffer, and urban wildlife rescue. | [aranya.gov.in](https://aranya.gov.in/) |

*Note on Contact Details:* Pursuant to simulation safety and verification guidelines, unverified personal phone numbers are excluded; citizens and reviewers are directed to statutory public web portals.

---

## 3. Administrative Zones Summary (MCC)

The 65 municipal wards are distributed across the 9 administrative zones:

| Zone | Zonal Office Location | Wards Supervised | Total Wards |
|---|---|---|:---:|
| **Zone 1** | Uttaradi Mutt Road, Agrahara | 50, 51, 54, 55, 60, 61, 62 | 7 |
| **Zone 2** | Krishnamurthipuram (CITB Choultry) | 42, 43, 44, 45, 46, 47, 56, 57, 58, 59, 63, 64, 65 | 13 |
| **Zone 3** | Gokulam / Vontikoppal | 6, 18, 19, 20, 21, 22 | 6 |
| **Zone 4** | Chamaraja / Devaraja Mohalla | 23, 40, 41, 48, 49 | 5 |
| **Zone 5** | Vijayanagar / Kumbarakoppal | 1, 2, 3, 4, 5 | 5 |
| **Zone 6** | Bannimantap / Metagalli | 7, 8, 9, 17, 24, 25 | 6 |
| **Zone 7** | N.R. Mohalla (Fountain Circle) | 10, 11, 12, 16, 26, 27, 28, 29 | 8 |
| **Zone 8** | Udayagiri / Sathagalli | 13, 14, 15, 30, 31, 32, 33, 34, 35 | 9 |
| **Zone 9** | Gayatripuram / Chamundi Vihar | 36, 37, 38, 39, 52, 53 | 6 |
| **Total** | | **Wards 1 through 65** | **65** |

---

## 4. Bounding Box & Geographic Parameters
- **Latitude Span:** 12.2600° N to 12.3700° N
- **Longitude Span:** 76.5950° E to 76.6950° E
- **Geodetic Datum:** WGS84 (EPSG:4326)
- **Geometry Format:** GeoJSON FeatureCollection (`docs/data/mysuru-ward-boundaries.geojson`) with polygonal boundaries and verified centroid properties.

---

## 5. Verification Status Methodology
- **Verified:** Official ward names, numbering, and zone assignments sourced from gazetted notifications of Mysuru District Administration and Star of Mysore election records.
- **Approximate Geometry:** Centroid Voronoi polygonal boundaries bounding each ward to provide offline SVG rendering and choropleth shading without external tile dependencies.
