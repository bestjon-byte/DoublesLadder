# Coaching Data Import - Completed

**Date:** November 7, 2025
**Status:** ✅ Successfully Completed

## Summary

Imported historical coaching session data from CSV files into the Tennis Ladder App.

## What Was Imported

### Sessions Created: 11 Total

**Adults (6:00 PM)** - 8 sessions:
- July 9, 16, 23, 30, 2025
- August 6, 13, 20, 27, 2025

**Beginners (7:00 PM)** - 3 sessions:
- August 14, 21, 28, 2025

### Attendance Records: 79 Total
- Adults: 43 attendance records
- Beginners: 36 attendance records
- All marked as **PAID** (everyone up to date as of last invoice)

### Ghost Accounts Created: 26 Players

Players not in the system were created with placeholder emails ending in `@coaching-import.example.com`:

**From Adults Session:**
1. Andrew D - andrew.d@coaching-import.example.com
2. Honor R - honor.r@coaching-import.example.com
3. Nick - nick@coaching-import.example.com
4. Peter V - peter.v@coaching-import.example.com
5. Sarah N - sarah.n@coaching-import.example.com
6. Dave S - dave.s@coaching-import.example.com

**From Beginners Session:**
7. Aidan - aidan@coaching-import.example.com
8. Di - di@coaching-import.example.com
9. Edward F - edward.f@coaching-import.example.com
10. Emily F - emily.f@coaching-import.example.com
11. Holly L - holly.l@coaching-import.example.com
12. Jock - jock@coaching-import.example.com
13. Julie S - julie.s@coaching-import.example.com
14. Karen - karen@coaching-import.example.com
15. Liv W - liv.w@coaching-import.example.com
16. Monty H - monty.h@coaching-import.example.com
17. Sal - sal@coaching-import.example.com
18. Sarah - sarah@coaching-import.example.com
19. Sarah B - sarah.b@coaching-import.example.com
20. Shani - shani@coaching-import.example.com
21. Tom - tom@coaching-import.example.com
22. Claire B - claire.b@coaching-import.example.com
23. Elle S - elle.s@coaching-import.example.com
24. Lucy D - lucy.d@coaching-import.example.com
25. Marthe - marthe@coaching-import.example.com
26. Diccon - diccon@coaching-import.example.com

### Matched to Existing Users: 15 Players

**Adults:**
- Andrew B → Andrew Bromley (arbromley@hotmail.com)
- Ben D → Ben Drummond (bendrummond470@gmail.com)
- Bev H → Bev (bev.2447e434@example.com)
- Charlie M → Charlie Meacham (cpmeach@gmail.com)
- Chris A → Chris Abbott (achrisjo@aol.com)
- James M → James Murphy (jamesmurph117@gmail.com)
- Joanne A → Joanne Abbott (joanneabbott19@gmail.com)
- Jon B → Jon Best (best.jon@gmail.com)
- Mark A → Mark Amy (markamy@lineone.net)
- Mark B → Mark B (markus727@hotmail.co.uk)
- Michael B → Michael Brennan (mickbrennan6@yahoo.com)
- Samuel B → Samuel Best (swb12@icloud.com)
- Stephen P → Stephen Parkin (stephen.parkin@sjpfs.uk.com)
- Oxanne W → Oxy (oxy.abc931be@example.com)

**Beginners:**
- Liz → Liz (liz.5e53d15f@example.com)

---

## Future: Merging Ghost Accounts

If any ghost account users sign up for the app, use the **Player Merge** feature in the Admin panel:

### Steps to Merge:
1. Go to **Admin Tab** → **Player Merge**
2. Select **Advanced Merge** mode
3. **Source Account** (data moves FROM): Select the ghost account (e.g., "Andrew D")
4. **Target Account** (data moves TO): Select the real user account
5. Click **Merge Accounts**

This will:
- Transfer all coaching attendance records
- Preserve payment history
- Maintain session attendance data
- Delete the ghost account (soft delete if referenced elsewhere)

---

## Data Files

**Source CSV Files:**
- `/screenshots/Coaching Tracker - Adults.csv`
- `/screenshots/Coaching Tracker - Beg.csv`

**Import Script:**
- `coaching-import.sql` (executed in Supabase SQL Editor)

**Import Date:** November 7, 2025

---

## Notes

- All players were marked as **paid up to date** as of their last session date
- Payment reference: "Historical import - paid up to date"
- Sessions marked as **completed**
- No schedules created (historical data only)
- All attendance marked by admin (self_registered = false)
