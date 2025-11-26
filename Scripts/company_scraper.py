#!/usr/bin/env python3
"""
company_scraper.py

Scrapes startup data from startups.gallery (https://startups.gallery/)
Outputs data in a format compatible with InvestLink's company_info.csv

Requirements:
    pip install selenium webdriver-manager

Usage:
    python3 company_scraper.py [--stages seed,series-a] [--output startups.csv]
    
Available stages:
    pre-seed, seed, series-a, series-b, series-c, latest
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

# Mapping of URL stages to our format
STAGE_MAPPING = {
    'pre-seed': 'Idea (Pre-Seed)',
    'seed': 'Prototype (Seed)',
    'series-a': 'Early revenue (Series A)',
    'series-b': 'Scaling (Series B)',
    'series-c': 'Growth (Series C/D)',
    'latest': 'Prototype (Seed)',  # Default for latest
}

# Industry keywords for classification
INDUSTRY_KEYWORDS = {
    'AI': ['ai', 'artificial intelligence', 'machine learning', 'ml', 'llm', 'gpt', 'neural', 'deep learning', 'model'],
    'Fintech': ['fintech', 'payment', 'banking', 'financial', 'invoice', 'billing', 'accounting', 'tax', 'crypto', 'defi'],
    'Healthcare': ['health', 'medical', 'clinical', 'patient', 'therapy', 'diagnostic', 'biomarker', 'care'],
    'DevTools': ['developer', 'devtools', 'api', 'sdk', 'infrastructure', 'code', 'programming', 'testing', 'deploy'],
    'Cybersecurity': ['security', 'cyber', 'encryption', 'privacy', 'auth', 'protection'],
    'E-commerce': ['commerce', 'shopping', 'retail', 'marketplace', 'store', 'shop'],
    'Productivity': ['productivity', 'workflow', 'collaboration', 'project', 'crm', 'task', 'calendar'],
    'Education': ['education', 'learning', 'course', 'student', 'teaching', 'school'],
    'Energy': ['energy', 'solar', 'wind', 'battery', 'power', 'electric', 'climate'],
    'Hardware': ['hardware', 'chip', 'semiconductor', 'robotics', 'robot', 'device', 'sensor'],
    'Biotech': ['biotech', 'genomic', 'dna', 'protein', 'cell', 'biology'],
    'Analytics': ['analytics', 'data', 'intelligence', 'insights', 'metrics', 'dashboard'],
    'Design': ['design', 'creative', 'visual', 'ui', 'ux', '3d', 'animation'],
    'Gaming': ['game', 'gaming', 'vr', 'virtual reality', 'play'],
    'Aerospace': ['space', 'aerospace', 'satellite', 'rocket', 'drone', 'flight'],
    'HR & Recruiting': ['hr', 'recruiting', 'hiring', 'talent', 'workforce', 'employee'],
    'Real Estate': ['real estate', 'property', 'housing', 'rent', 'home'],
    'Logistics': ['logistics', 'delivery', 'shipping', 'freight', 'supply chain', 'transport'],
    'Media': ['media', 'content', 'video', 'audio', 'podcast', 'news'],
    'Consumer': ['consumer', 'social', 'lifestyle', 'personal', 'dating'],
}


def init_driver(headless=False):
    """Initialize Chrome WebDriver"""
    options = webdriver.ChromeOptions()
    
    if headless:
        options.add_argument('--headless')
    
    options.add_argument('--start-maximized')
    options.add_argument('--disable-blink-features=AutomationControlled')
    options.add_experimental_option("excludeSwitches", ["enable-automation"])
    options.add_experimental_option('useAutomationExtension', False)
    
    options.add_argument('user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except:
        driver = webdriver.Chrome(options=options)
    
    driver.execute_script("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})")
    
    return driver


def infer_industry(description):
    """Infer industry from company description"""
    desc_lower = description.lower()
    
    for industry, keywords in INDUSTRY_KEYWORDS.items():
        for keyword in keywords:
            if keyword in desc_lower:
                return industry
    
    return 'Software'


def scrape_stage(driver, stage, delay_range=(2, 5)):
    """
    Scrape companies for a specific funding stage
    
    Args:
        driver: Selenium WebDriver
        stage: Funding stage to scrape (e.g., 'seed', 'series-a')
        delay_range: (min, max) seconds to wait for scrolling
    
    Returns:
        List of company dictionaries
    """
    results = []
    funding_stage = STAGE_MAPPING.get(stage, 'Prototype (Seed)')
    
    # Build URL
    if stage == 'latest':
        url = "https://startups.gallery/"
    else:
        url = f"https://startups.gallery/?stage={stage}"
    
    print(f"\n[{stage.upper()}] Loading: {url}")
    driver.get(url)
    
    # Initial wait
    time.sleep(random.uniform(3, 5))
    
    # Scroll to load more companies (infinite scroll)
    last_height = driver.execute_script("return document.body.scrollHeight")
    scroll_attempts = 0
    max_scrolls = 20  # Limit scrolling
    
    while scroll_attempts < max_scrolls:
        # Scroll down
        driver.execute_script("window.scrollTo(0, document.body.scrollHeight);")
        
        time.sleep(random.uniform(*delay_range))
        
        new_height = driver.execute_script("return document.body.scrollHeight")
        
        if new_height == last_height:
            # Try clicking "Load More" button if exists
            try:
                load_more = driver.find_element(By.XPATH, "//button[contains(text(), 'Load') or contains(text(), 'More')]")
                load_more.click()
                time.sleep(2)
            except:
                break
        
        last_height = new_height
        scroll_attempts += 1
        print(f"  Scrolled {scroll_attempts} times...")
    
    # Now extract company data
    # The site uses card-based layout
    try:
        # Try multiple selectors for company cards
        selectors = [
            "a[href*='/companies/']",
            "[class*='company']",
            "[class*='card']",
            "article",
        ]
        
        companies_found = []
        
        for selector in selectors:
            elements = driver.find_elements(By.CSS_SELECTOR, selector)
            if elements:
                companies_found = elements
                print(f"  Found {len(elements)} elements with selector: {selector}")
                break
        
        # Extract data from company links/cards
        seen_names = set()
        
        for elem in companies_found:
            try:
                # Get the link href
                href = elem.get_attribute("href")
                if not href or '/companies/' not in href:
                    # Try to find link inside the element
                    try:
                        link = elem.find_element(By.CSS_SELECTOR, "a[href*='/companies/']")
                        href = link.get_attribute("href")
                    except:
                        continue
                
                # Get company name from the text or title
                text = elem.text.strip()
                lines = text.split('\n')
                
                company_name = lines[0] if lines else ""
                description = lines[1] if len(lines) > 1 else ""
                
                # Clean up name
                company_name = company_name.strip()
                if not company_name or len(company_name) < 2:
                    continue
                
                # Skip duplicates
                if company_name.lower() in seen_names:
                    continue
                seen_names.add(company_name.lower())
                
                # Try to get logo/image
                logo_url = ""
                try:
                    img = elem.find_element(By.TAG_NAME, "img")
                    logo_url = img.get_attribute("src")
                except:
                    pass
                
                # Infer industry from description
                industry = infer_industry(description) if description else 'Software'
                
                company = {
                    'name': company_name,
                    'description': description,
                    'place': 'USA',  # Default
                    'funding_stage': funding_stage,
                    'industry': industry,
                    'fund_size': '',
                    'website': href,
                    'logo_url': logo_url
                }
                
                results.append(company)
                print(f"    ✓ {company_name}")
                
            except Exception as e:
                continue
        
    except Exception as e:
        print(f"  Error extracting companies: {e}")
    
    print(f"  Extracted {len(results)} companies for {stage}")
    return results


def scrape_companies(driver, stages, delay_range=(2, 5)):
    """
    Scrape companies from multiple funding stages
    
    Args:
        driver: Selenium WebDriver
        stages: List of funding stages to scrape
        delay_range: Delay range between operations
    
    Returns:
        List of company dictionaries
    """
    all_results = []
    seen_names = set()
    
    print(f"\n{'='*60}")
    print(f"Starting Startups Gallery Scraper")
    print(f"Stages: {', '.join(stages)}")
    print(f"{'='*60}")
    
    for stage in stages:
        results = scrape_stage(driver, stage, delay_range)
        
        # Deduplicate across stages
        for company in results:
            name_lower = company['name'].lower()
            if name_lower not in seen_names:
                seen_names.add(name_lower)
                all_results.append(company)
        
        # Delay between stages
        if stage != stages[-1]:
            delay = random.uniform(3, 6)
            print(f"\n  Waiting {delay:.1f}s before next stage...")
            time.sleep(delay)
    
    return all_results


def save_csv(data, filename):
    """Save data to CSV file"""
    if not data:
        print("No data to save!")
        return None
    
    filepath = DATA_ROOT / filename
    
    with open(filepath, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow([
            "Company_Name",
            "Description",
            "Place",
            "Funding_Stage",
            "Industry",
            "Fund_Size",
            "Website",
            "Logo_URL"
        ])
        
        for row in data:
            writer.writerow([
                row['name'],
                row['description'],
                row['place'],
                row['funding_stage'],
                row['industry'],
                row['fund_size'],
                row['website'],
                row['logo_url']
            ])
    
    print(f"\n✅ Saved {len(data)} companies to: {filepath}")
    return filepath


def save_by_stage(data, base_filename):
    """Save data split by funding stage"""
    stages = {}
    
    for company in data:
        stage = company['funding_stage']
        if stage not in stages:
            stages[stage] = []
        stages[stage].append(company)
    
    filepaths = []
    for stage, companies in stages.items():
        # Clean stage name for filename
        stage_clean = stage.lower().replace(' ', '_').replace('(', '').replace(')', '')
        filename = f"{base_filename}_{stage_clean}.csv"
        filepath = save_csv(companies, filename)
        if filepath:
            filepaths.append(filepath)
    
    return filepaths


def main():
    parser = argparse.ArgumentParser(description="Scrape startup data from startups.gallery")
    parser.add_argument('--stages', type=str, default='pre-seed,seed,series-a,series-b,series-c',
                        help='Comma-separated list of stages to scrape (default: all)')
    parser.add_argument('--output', type=str, default=None, 
                        help='Output filename (default: startups_gallery_TIMESTAMP.csv)')
    parser.add_argument('--headless', action='store_true', help='Run in headless mode')
    parser.add_argument('--split-by-stage', action='store_true', 
                        help='Save separate CSV files for each stage')
    parser.add_argument('--min-delay', type=float, default=2.0, 
                        help='Minimum delay between operations (default: 2)')
    parser.add_argument('--max-delay', type=float, default=5.0, 
                        help='Maximum delay between operations (default: 5)')
    
    args = parser.parse_args()
    
    # Parse stages
    stages = [s.strip() for s in args.stages.split(',')]
    
    # Generate output filename
    if args.output:
        output_file = args.output
    else:
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_file = f"startups_gallery_{timestamp}.csv"
    
    print("="*60)
    print("Startups Gallery Scraper")
    print("="*60)
    print(f"Stages: {', '.join(stages)}")
    print(f"Output: {output_file}")
    print(f"Headless: {args.headless}")
    print(f"Split by stage: {args.split_by_stage}")
    print(f"Delay: {args.min_delay}-{args.max_delay}s")
    
    driver = init_driver(headless=args.headless)
    data = []
    
    try:
        print("\nStarting scraper... (Press Ctrl+C to stop early)")
        data = scrape_companies(
            driver, 
            stages,
            delay_range=(args.min_delay, args.max_delay)
        )
        
        if args.split_by_stage:
            base_name = output_file.replace('.csv', '')
            save_by_stage(data, base_name)
        else:
            save_csv(data, output_file)
        
        print("\n" + "="*60)
        print(f"🎉 COMPLETE! Scraped {len(data)} companies")
        print("="*60)
        print("\nNext steps:")
        print("1. Run 'python3 Scripts/Convert_Data.py --companies-only' to convert data")
        print("2. Run 'python3 Scripts/Make_Database.py' to update the database")
        
    except KeyboardInterrupt:
        print("\n\n⚠️ Scraping interrupted by user")
        if data:
            print(f"Saving {len(data)} companies collected so far...")
            save_csv(data, output_file)
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        if data:
            print(f"Saving {len(data)} companies collected before error...")
            save_csv(data, output_file)
    finally:
        driver.quit()
        print("Browser closed.")


if __name__ == "__main__":
    main()

