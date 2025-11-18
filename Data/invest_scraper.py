import time, random, csv
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

def init_driver():
    options = webdriver.ChromeOptions()
    driver = webdriver.Chrome(options=options)
    return driver

def scrape_investors(driver):
    driver.get("https://www.openvc.app")

    # wait for table (open for a sec and disappers?)
    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "#results_tb"))
    )

    rows = driver.find_elements(By.CSS_SELECTOR, "#results_tb tbody tr")

    results = []

    for row in rows:
        try:
            # --- Picture ---
            img = row.find_element(By.CSS_SELECTOR, "td.logoCell img").get_attribute("src")

            # --- Name + Website (website is in another page?) ---
            name_cell = row.find_element(By.CSS_SELECTOR, "td.nameCell a")
            website = name_cell.get_attribute("href")
            full_text = name_cell.text.strip().split("\n")
            investor_name = full_text[0]
            industry = full_text[1] if len(full_text) > 1 else ""

            # --- Target countries (only the first few show up?) ---
            places = row.find_element(
                By.CSS_SELECTOR, "td[data-label='Target countries']"
            ).text.replace("\n", " ")

            # --- Check size ---
            check_size = row.find_element(
                By.CSS_SELECTOR, "td[data-label='Check size']"
            ).text

            # parse min/max
            # e.g. "$50k to $200k"
            parts = check_size.replace("$", "").replace("k", "000").split("to")
            check_min = parts[0].strip()
            check_max = parts[1].strip() if len(parts) > 1 else ""

            # --- Funding stages ---
            fund_stage = row.find_element(
                By.CSS_SELECTOR, "td[data-label='Funding stages']"
            ).text.replace("\n", ", ")

            # --- Requirements (not in this snippet?) ---
            invest_requirements = ""

            results.append([
                invest_requirements,
                places,
                fund_stage,
                industry,
                check_max,
                check_min,
                website,
                img
            ])

        except Exception as e:
            print("Error on row:", e)
            continue

    return results


def save_csv(data, filename="openvc_investors.csv"):
    downloads = os.path.join(os.path.expanduser("~"), "Downloads")
    filepath = os.path.join(downloads, filename)

    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "U_invest_requirements",
            "U_places",
            "U_fund_stage",
            "U_industry",
            "U_check_size_max",
            "U_check_size_min",
            "U_website",
            "U_pic_link"
        ])
        writer.writerows(data)

    print("Saved to:", filepath)


def main():
    driver = init_driver()
    try:
        data = scrape_investors(driver)
        save_csv(data)
    finally:
        driver.quit()


if __name__ == "__main__":
    main()
