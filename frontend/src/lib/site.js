import { createContext, useContext } from "react";
import { locations } from "../locations";

export const SiteContext = createContext(null);
export const useSite = () => useContext(SiteContext);

export const SITE_TO_LOCATION = { malaga: "malaga", malta: "sliema" };
export const siteLocation = (site) => locations.find((l) => l.id === SITE_TO_LOCATION[site]) || locations[0];
export const SITE_NAME = { malaga: "Kalamà Málaga", malta: "Kalamà Sliema" };
