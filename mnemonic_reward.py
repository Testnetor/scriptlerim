from substrateinterface import Keypair
import os
import csv

GREEN = '\033[92m'
RED = '\033[91m'
RESET = '\033[0m'
BOLD = '\033[1m'
YELLOW = '\033[93m'
BLUE = '\033[94m'

def mnemonic_to_address(mnemonic):
    kp = Keypair.create_from_mnemonic(mnemonic, ss58_format=5234)
    return kp.ss58_address

def get_reward_info(address, reward_file='list.csv'):
    try:
        with open(reward_file, mode='r', newline='', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile, delimiter='\t')
            for row in reader:
                if len(row) == 2:
                    addr, reward = row
                    if addr.strip() == address.strip():
                        return reward.strip()
    except Exception as e:
        print(f"{RED}CSV okuma hatası:{RESET} {e}")
    return None

def remove_colors(text):
    return text.replace(GREEN, '').replace(RED, '').replace(RESET, '').replace(BOLD, '').replace(YELLOW, '').replace(BLUE, '')

def main():
    if os.path.exists('odullerlistesi.txt'):
        os.remove('odullerlistesi.txt')

    total_reward = 0
    reward_results = []
    no_reward_found_list = []
    tam_odul_cuzdan_sayisi = 0
    yarim_odul_cuzdan_sayisi = 0
    no_reward_found = 0

    with open('mnemonic.txt', 'r') as f:
        mnemonics = [line.strip() for line in f if line.strip()]
    with open('isimler.txt', 'r') as f:
        names = [line.strip() for line in f if line.strip()]

    for mnemonic, name in zip(mnemonics, names):
        address = mnemonic_to_address(mnemonic)
        reward = get_reward_info(address)
        if reward is not None:
            reward_float = float(reward)
            total_reward += reward_float
            if reward_float >= 400:
                tam_odul_cuzdan_sayisi += 1
                color = BLUE
            elif 150 <= reward_float < 400:
                yarim_odul_cuzdan_sayisi += 1
                color = GREEN
            elif reward_float == 0:
                color = YELLOW
                no_reward_found += 1
            else:
                color = RESET
            line = f"İsim: {name} | Adres: {address} | Ödül: {reward} HMND"
            reward_results.append((reward_float, color + line + RESET))
        else:
            no_reward_found += 1
            line = RED + f"İsim: {name} | Adres: {address} | Ödül: Bulunamadı" + RESET
            no_reward_found_list.append((0, line))

    reward_results.sort(reverse=True, key=lambda x: x[0])

    with open('odullerlistesi.txt', 'w', encoding='utf-8') as f:
        for _, line in reward_results:
            print(line)
            f.write(remove_colors(line) + '\n')
        for _, line in no_reward_found_list:
            print(line)
            f.write(remove_colors(line) + '\n')

        f.write(f"\nTOPLAM HMND MİKTARI : {round(total_reward, 2)}\n")
        f.write(f"TAM ÖDÜL ALAN CÜZDAN SAYISI (~469 civarı): {tam_odul_cuzdan_sayisi}\n")
        f.write(f"YARIM ÖDÜL ALAN CÜZDAN SAYISI (~225 civarı): {yarim_odul_cuzdan_sayisi}\n")
        f.write(f"ÖDÜL ALAMAYAN CÜZDAN SAYISI (0 veya bulunamadı): {no_reward_found}\n")

    summary = f"\n\nHelali hoş olsun Allah bereketini arttırsın\n\n" \
              f"TOPLAM HMND MİKTARI : {round(total_reward, 2)}\n" \
              f"TAM ÖDÜL ALAN CÜZDAN SAYISI (~469 civarı): {tam_odul_cuzdan_sayisi}\n" \
              f"YARIM ÖDÜL ALAN CÜZDAN SAYISI (~225 civarı): {yarim_odul_cuzdan_sayisi}\n" \
              f"ÖDÜL ALAMAYAN CÜZDAN SAYISI (0 veya bulunamadı): {no_reward_found}\n"

    print(BOLD + summary + RESET)

if __name__ == '__main__':
    main()