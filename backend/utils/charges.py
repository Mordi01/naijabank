from config import Config

def calculate_transfer_charge(amount, transfer_count):
    charge = 0
    free_transfers = Config.FREE_TRANSFERS
    high_threshold = Config.HIGH_AMOUNT_THRESHOLD

    if amount > high_threshold:
        charge += Config.CHARGE_HIGH_AMOUNT

    if transfer_count >= free_transfers and transfer_count < 10:
        charge += Config.CHARGE_AFTER_FREE

    return charge