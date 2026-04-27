export const MAX_ACTIVE_SUPPLY_LISTINGS_PER_SUPPLIER = 25;

export type SupplyListingGuardState = {
  activeSupplyCount: number;
};

export function assertSupplyListingAllowed(input: SupplyListingGuardState) {
  if (input.activeSupplyCount >= MAX_ACTIVE_SUPPLY_LISTINGS_PER_SUPPLIER) {
    throw new Error(
      "Too many active supply listings. Archive or consolidate an existing listing before publishing another one.",
    );
  }
}
