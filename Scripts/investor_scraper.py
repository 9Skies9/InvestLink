#!/usr/bin/env python3
"""
investor_scraper.py

Scrapes investor data from OpenVC (https://www.openvc.app/)
Outputs data in a format compatible with InvestLink's user_info.csv

Requirements:
    pip install selenium webdriver-manager

Usage:
    python3 investor_scraper.py [--pages 50] [--output investors.csv]
"""

import time
import csv
import os
import random
import argparse
from pathlib import Path
from datetime import datetime

try:
    from selenium import webdriver
    from selenium.webdriver.common.by import By
    from selenium.webdriver.support.ui import WebDriverWait
    from selenium.webdriver.support import expected_conditions as EC
    from selenium.webdriver.chrome.service import Service
    from webdriver_manager.chrome import ChromeDriverManager
except ImportError:
    print("Please install required packages:")
    print("  pip install selenium webdriver-manager")
    exit(1)

ROOT = Path(__file__).resolve().parent.parent
DATA_ROOT = ROOT / "Data"


def init_driver(headless=False):
    """Initialize Chrome WebDriver"""
    options = webdriver.ChromeOptions()
    
    if headless:
        options.add_argument('--headless')
    
    options.add_argument('--start-maximized')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    # User agent to look more like a real browser
    options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except:
        # Fallback if webdriver-manager doesn't work
        driver = webdriver.Chrome(options=options)
    
    # Evade detection
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver


def scrape_investors(driver, max_pages=50, delay_range=(3, 7)):
    """
    Scrape investor data from OpenVC using infinite scroll
    
    Args:
        driver: Selenium WebDriver
        max_pages: Maximum number of scroll iterations
        delay_range: (min, max) seconds to wait between scrolls
    
    Returns:
        List of investor dictionaries
    """
    results = []
    seen_names = set()
    
    print(f"\n{'='*60}")
    print(f"Starting OpenVC Scraper (Infinite Scroll Mode)")
    print(f"Max scrolls: {max_pages}")
    print(f"{'='*60}\n")
    
    # Load the main search page
    url = "https://www.openvc.app/search"
    print(f"Loading: {url}")
    driver.get(url)
    
    # Initial wait for page load
    delay = random.uniform(*delay_range)
    print(f"  Initial wait {delay:.1f}s...")
    time.sleep(delay)
    
    # Wait for table to load
    try:
        WebDriverWait(driver, 15).until(
            EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr"))
        )
    except:
        print(f"  ⚠️ No table found, trying alternative selectors...")
        # Try other common selectors
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "[class*='investor'], [class*='card'], [class*='row']"))
            )
        except:
            print(f"  ❌ Could not find investor data on page")
            return results
    
    scroll_count = 0
    last_count = 0
    no_new_count = 0
    
    while scroll_count < max_pages:
        scroll_count += 1
        
        rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
        print(f"\n[Scroll {scroll_count}/{max_pages}] Found {len(rows)} rows total")
        
        if len(rows) == 0:
            print(f"  No rows found, stopping")
            break
        
        new_count = 0
        
        for i, row in enumerate(rows):
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                
                # Skip rows with insufficient cells
                if len(cells) < 5:
                    continue
                
                # Extract data from cells
                # Cell 0: Logo
                logo_url = ""
                try:
                    img_elem = cells[0].find_element(By.TAG_NAME, "img")
                    logo_url = img_elem.get_attribute("src")
                except:
                    pass
                
                # Cell 1: Name and Type
                name_text = cells[1].text.strip().split("\n")
                investor_name = name_text[0] if len(name_text) > 0 else ""
                investor_type = name_text[1] if len(name_text) > 1 else ""
                
                if not investor_name:
                    continue
                
                # Skip if already seen
                if investor_name in seen_names:
                    continue
                seen_names.add(investor_name)
                
                # Cell 2: Locations
                locations = cells[2].text.strip().replace("\n", ", ")
                
                # Cell 3: Check Size
                check_size_raw = cells[3].text.strip()
                check_min, check_max = "", ""
                if "to" in check_size_raw.lower():
                    parts = check_size_raw.split("to")
                    check_min = parts[0].strip()
                    check_max = parts[1].strip() if len(parts) > 1 else ""
                else:
                    check_min = check_size_raw
                    check_max = check_size_raw
                
                # Cell 4: Stage
                stage = cells[4].text.strip().replace("\n", ", ")
                
                # Cell 5: Requirements/Description
                requirements = cells[5].text.strip() if len(cells) > 5 else ""
                
                # Cell 6: Industries
                industries = cells[6].text.strip().replace("\n", ", ") if len(cells) > 6 else ""
                
                # Cell 7: Website
                website = ""
                try:
                    if len(cells) > 7:
                        links = cells[7].find_elements(By.TAG_NAME, "a")
                        if links:
                            website = links[0].get_attribute("href")
                except:
                    pass
                
                investor = {
                    'name': investor_name,
                    'type': investor_type,
                    'locations': locations,
                    'check_min': check_min,
                    'check_max': check_max,
                    'stage': stage,
                    'requirements': requirements,
                    'industries': industries,
                    'website': website,
                    'logo_url': logo_url
                }
                
                results.append(investor)
                new_count += 1
                print(f"    ✓ {investor_name[:30]}...")
                
            except Exception as e:
                print(f"    ✗ Error on row {i}: {e}")
                continue
        
        print(f"  New investors this scroll: {new_count} (Total unique: {len(results)})")
        
        # Check if we got new data
        if len(results) == last_count:
            no_new_count += 1
            if no_new_count >= 3:
                print(f"  No new data after 3 scrolls, stopping")
                break
        else:
            no_new_count = 0
            last_count = len(results)
        
        # Scroll down to load more
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        
        # Also try clicking "Load More" button if it exists
        try:
            load_more = driver.find_element(By.XPATH, "//button[contains(text(), 'Load') or contains(text(), 'More') or contains(text(), 'Show')]")
            load_more.click()
            print(f"  Clicked 'Load More' button")
        except:
            pass
        
        # Wait for new content
        delay = random.uniform(*delay_range)
        print(f"  Waiting {delay:.1f}s for more content...")
        time.sleep(delay)
    
    return results


def save_csv(data, filename):
    """Save data to CSV file"""
    if not data:
        print("No data to save!")
        return None
    
    filepath = DATA_ROOT / filename
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Investor_Name",
            "Type",
            "Locations",
            "Check_Size_Min",
            "Check_Size_Max",
            "Stage",
            "Requirements",
            "Industries",
            "Website",
            "Logo_URL"
        ])
        
        for row in data:
            writer.writerow([
                row['name'],
                row['type'],
                row['locations'],
                row['check_min'],
                row['check_max'],
                row['stage'],
                row['requirements'],
                row['industries'],
                row['website'],
                row['logo_url']
            ])
    
    print(f"\n✅ Saved {len(data)} investors to: {filepath}")
    return filepath


def scrape_with_filters(driver, delay_range=(3, 7)):
    """
    Scrape investors using multiple filter combinations to get more results
    OpenVC limits results per filter, so we use different filters
    """
    all_investors = []
    seen_names = set()
    
    # Different filter URLs to try
    filter_urls = [
        "https://www.openvc.app/search",  # Default
        "https://www.openvc.app/search?stage=1",  # Idea stage
        "https://www.openvc.app/search?stage=2",  # Prototype stage  
        "https://www.openvc.app/search?stage=3",  # Early Revenue
        "https://www.openvc.app/search?stage=4",  # Scaling
        "https://www.openvc.app/search?stage=5",  # Growth
        "https://www.openvc.app/search?type=vc",  # VC firms only
        "https://www.openvc.app/search?type=angel",  # Angels only
        "https://www.openvc.app/search?type=accelerator",  # Accelerators
        "https://www.openvc.app/search?location=USA",  
        "https://www.openvc.app/search?location=UK",
        "https://www.openvc.app/search?location=Germany",
        "https://www.openvc.app/search?location=France",
        "https://www.openvc.app/search?location=India",
        "https://www.openvc.app/search?location=Canada",
    ]
    
    print(f"\n{'='*60}")
    print(f"Starting Multi-Filter Scrape")
    print(f"Trying {len(filter_urls)} different filters")
    print(f"{'='*60}\n")
    
    for idx, url in enumerate(filter_urls, 1):
        print(f"\n[Filter {idx}/{len(filter_urls)}] {url}")
        driver.get(url)
        
        delay = random.uniform(*delay_range)
        time.sleep(delay)
        
        try:
            WebDriverWait(driver, 10).until(
                EC.presence_of_element_located((By.CSS_SELECTOR, "table tbody tr"))
            )
        except:
            print(f"  ⚠️ No results for this filter")
            continue
        
        rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
        new_count = 0
        
        for row in rows:
            try:
                cells = row.find_elements(By.TAG_NAME, "td")
                if len(cells) < 5:
                    continue
                
                logo_url = ""
                try:
                    img_elem = cells[0].find_element(By.TAG_NAME, "img")
                    logo_url = img_elem.get_attribute("src")
                except:
                    pass
                
                name_text = cells[1].text.strip().split("\n")
                investor_name = name_text[0] if len(name_text) > 0 else ""
                investor_type = name_text[1] if len(name_text) > 1 else ""
                
                if not investor_name or investor_name in seen_names:
                    continue
                seen_names.add(investor_name)
                
                locations = cells[2].text.strip().replace("\n", ", ")
                check_size_raw = cells[3].text.strip()
                check_min, check_max = "", ""
                if "to" in check_size_raw.lower():
                    parts = check_size_raw.split("to")
                    check_min = parts[0].strip()
                    check_max = parts[1].strip() if len(parts) > 1 else ""
                else:
                    check_min = check_size_raw
                    check_max = check_size_raw
                
                stage = cells[4].text.strip().replace("\n", ", ")
                requirements = cells[5].text.strip() if len(cells) > 5 else ""
                industries = cells[6].text.strip().replace("\n", ", ") if len(cells) > 6 else ""
                
                website = ""
                try:
                    if len(cells) > 7:
                        links = cells[7].find_elements(By.TAG_NAME, "a")
                        if links:
                            website = links[0].get_attribute("href")
                except:
                    pass
                
                all_investors.append({
                    'name': investor_name,
                    'type': investor_type,
                    'locations': locations,
                    'check_min': check_min,
                    'check_max': check_max,
                    'stage': stage,
                    'requirements': requirements,
                    'industries': industries,
                    'website': website,
                    'logo_url': logo_url
                })
                new_count += 1
                
            except Exception as e:
                continue
        
        print(f"  Found {new_count} new investors (Total unique: {len(all_investors)})")
        time.sleep(random.uniform(2, 4))  # Brief pause between filters
    
    return all_investors


def main():
    parser = argparse.ArgumentParser(description="Scrape investor data from OpenVC")
    parser.add_argument('--pages', type=int, default=50, help='Number of scroll iterations (default: 50)')
    parser.add_argument('--output', type=str, default=None, help='Output filename (default: openvc_investors_TIMESTAMP.csv)')
    parser.add_argument('--multi-filter', action='store_true', help='Scrape using multiple filter combinations to get more investors')
    parser.add_argument('--headless', action='store_true', help='Run in headless mode')
    parser.add_argument('--min-delay', type=float, default=3.0, help='Minimum delay between pages (default: 3)')
    parser.add_argument('--max-delay', type=float, default=7.0, help='Maximum delay between pages (default: 7)')
    
    args = parser.parse_args()
    
    # Generate output filename
    if args.output:
        output_file = args.output
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"openvc_investors_{timestamp}.csv"
    
    print("="*60)
    print("OpenVC Investor Scraper")
    print("="*60)
    print(f"Pages: {args.pages}")
    print(f"Output: {output_file}")
    print(f"Headless: {args.headless}")
    print(f"Multi-filter: {args.multi_filter}")
    print(f"Delay: {args.min_delay}-{args.max_delay}s")
    
    driver = init_driver(headless=args.headless)
    data = []
    
    try:
        print("\nStarting scraper... (Press Ctrl+C to stop early)")
        
        if args.multi_filter:
            # Use multi-filter approach to get more investors
            data = scrape_with_filters(
                driver,
                delay_range=(args.min_delay, args.max_delay)
            )
        else:
            data = scrape_investors(
                driver, 
                max_pages=args.pages,
                delay_range=(args.min_delay, args.max_delay)
            )
        save_csv(data, output_file)
        
        print("\n" + "="*60)
        print(f"🎉 COMPLETE! Scraped {len(data)} investors")
        print("="*60)
        print("\nNext steps:")
        print("1. Run 'python3 Scripts/Convert_Data.py --investors-only' to convert data")
        print("2. Run 'python3 Scripts/Make_Database.py' to update the database")
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Scraping interrupted by user")
        if data:
            print(f"Saving {len(data)} investors collected so far...")
            save_csv(data, output_file)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        if data:
            print(f"Saving {len(data)} investors collected before error...")
            save_csv(data, output_file)
    finally:
        driver.quit()
        print("Browser closed.")


if __name__ == "__main__":
    main()

