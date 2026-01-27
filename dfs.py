import random
import time
from typing import Dict, List, Set, Tuple

class DarkWebCrawler:
    def __init__(self):
        self.network_topology = self._build_network()
        self.node_metadata = self._generate_metadata()
        self.visited_nodes = set()
        self.connection_map = {}
        self.hop_counter = 0
        self.total_risk = 0
        self.found_services = []
        
    def _classify_node(self, node_name: str) -> str:
        if node_name.startswith('ENTRY_'):
            return 'EntryNode'
        elif node_name.startswith('HS_'):
            return 'HiddenService'
        elif node_name.startswith('TOR_'):
            return 'RelayNode'
        elif 'RELAY' in node_name:
            return 'RelayNode'
        elif 'SERVICE' in node_name:
            return 'HiddenService'
        else:
            return 'RelayNode'
    
    def _generate_metadata(self) -> Dict:
        metadata = {}
        for node in self.network_topology:
            node_type = self._classify_node(node)
            
            if node_type == 'EntryNode':
                base_risk = random.randint(40, 70)
                latency = random.randint(10, 30)
            elif node_type == 'HiddenService':
                base_risk = random.randint(80, 94)
                latency = random.randint(70, 100)
            else:
                base_risk = random.randint(20, 60)
                latency = random.randint(1, 20)
            
            risk_score = min(94, base_risk + random.randint(-10, 10))
            
            metadata[node] = {
                'type': node_type,
                'risk_score': risk_score,
                'latency_ms': latency,
                'encryption_level': random.choice(['AES-256', 'ChaCha20', 'RSA-2048']),
                'traffic_pattern': random.choice(['BURST', 'STEADY', 'INTERMITTENT'])
            }
        return metadata
    
    def _build_network(self) -> Dict[str, List[str]]:
        topology = {
            'ENTRY_GATEWAY': ['TOR_RELAY_01', 'TOR_RELAY_02', 'DARK_RELAY_A'],
            'TOR_RELAY_01': ['TOR_RELAY_03', 'HS_MARKET_ALPHA'],
            'TOR_RELAY_02': ['TOR_RELAY_04', 'HS_FORUM_SIGMA'],
            'TOR_RELAY_03': ['TOR_RELAY_07', 'TOR_RELAY_08', 'HS_CHAT_OMEGA'],
            'TOR_RELAY_04': ['TOR_RELAY_09', 'EXIT_RELAY_BETA'],
            'TOR_RELAY_07': ['HS_DATA_VAULT'],
            'TOR_RELAY_08': ['TOR_RELAY_10'],
            'TOR_RELAY_09': ['TOR_RELAY_11', 'HS_MAIL_PHI'],
            'TOR_RELAY_10': ['TOR_RELAY_12', 'HS_BLOG_THETA'],
            'TOR_RELAY_11': ['TOR_RELAY_12'],
            'TOR_RELAY_12': ['HS_ARCHIVE_KAPPA'],
            'DARK_RELAY_A': ['TOR_RELAY_03', 'DARK_RELAY_B'],
            'DARK_RELAY_B': ['HS_FORUM_SIGMA', 'TOR_RELAY_09'],
            'HS_MARKET_ALPHA': [],
            'HS_FORUM_SIGMA': ['TOR_RELAY_10'],
            'HS_CHAT_OMEGA': [],
            'HS_DATA_VAULT': [],
            'HS_MAIL_PHI': [],
            'HS_BLOG_THETA': [],
            'HS_ARCHIVE_KAPPA': [],
            'EXIT_RELAY_BETA': ['TOR_RELAY_11']
        }
        return topology
    
    def _analyze_traffic_pattern(self, current_node: str):
        metadata = self.node_metadata[current_node]
        pattern = metadata['traffic_pattern']
        risk = metadata['risk_score']
        
        print(f"    Analyzing traffic pattern... [{pattern}]")
        
        if risk > 80:
            print("    WARNING: CORRELATION RISK: CRITICAL")
            print("    ALERT: Potential deanonymization threat detected!")
        elif risk > 60:
            print("    WARNING: Correlation risk: HIGH")
        elif risk > 40:
            print("    INFO: Correlation risk: MEDIUM")
        else:
            print("    OK: Correlation risk: LOW")
        
        if pattern == 'BURST':
            print("    NOTICE: Burst traffic detected - possible data exfiltration")
        elif pattern == 'INTERMITTENT':
            print("    NOTICE: Intermittent patterns - likely human activity")
    
    def _crawl_dfs(self, current_node: str, depth: int, path: List[str]):
        if current_node in self.visited_nodes:
            return
        
        self.visited_nodes.add(current_node)
        self.hop_counter += 1
        path = path + [current_node]
        
        metadata = self.node_metadata[current_node]
        node_type = metadata['type']
        risk_score = metadata['risk_score']
        self.total_risk += risk_score
        
        print(f"[HOP {depth}] {node_type.upper()} FOUND -> {current_node}")
        print(f"    Risk Score: {risk_score} | Latency: {metadata['latency_ms']}ms")
        print(f"    Encryption: {metadata['encryption_level']}")
        
        self.connection_map[current_node] = {
            'depth': depth,
            'connections': self.network_topology[current_node],
            'path': path.copy()
        }
        
        if node_type == 'HiddenService':
            self.found_services.append(current_node)
            print(f"    ALERT: HIDDEN SERVICE IDENTIFIED: {current_node}")
            self._analyze_traffic_pattern(current_node)
            
            if random.random() > 0.7:
                print("    NOTICE: Service fingerprint obtained")
                print("    NOTICE: Protocol analysis: Onion v3 detected")
        
        time.sleep(0.1)
        
        for next_node in self.network_topology[current_node]:
            if next_node not in self.visited_nodes:
                if random.random() > 0.8:
                    print(f"    Analyzing hop {current_node} -> {next_node}")
                    print(f"    Connection integrity: {random.choice(['STRONG', 'WEAK', 'COMPROMISED'])}")
                
                self._crawl_dfs(next_node, depth + 1, path)
    
    def generate_network_map(self):
        print("\n" + "="*60)
        print("DARK WEB NETWORK TOPOLOGY MAP")
        print("="*60)
        
        for node, info in self.connection_map.items():
            indent = "  " * info['depth']
            node_type = self._classify_node(node)
            
            print(f"{indent}[{node_type[:1]}] {node} (Depth: {info['depth']}, Risk: {self.node_metadata[node]['risk_score']})")
            
            if info['connections']:
                for conn in info['connections']:
                    conn_type = self._classify_node(conn)
                    print(f"{indent}  --> [{conn_type[:1]}] {conn}")
        
        print("="*60)
    
    def display_statistics(self):
        print("\n" + "="*60)
        print("CRAWLING ANALYSIS REPORT")
        print("="*60)
        
        avg_risk = self.total_risk / len(self.visited_nodes) if self.visited_nodes else 0
        
        print(f"Total Nodes Crawled: {len(self.visited_nodes)}")
        print(f"Total Hops: {self.hop_counter}")
        print(f"Hidden Services Found: {len(self.found_services)}")
        print(f"Average Network Risk: {avg_risk:.1f}")
        print(f"Compromised Nodes Detected: {random.randint(0, 2)}")
        
        if avg_risk > 70:
            print("ALERT: NETWORK SECURITY STATUS: HIGH RISK")
        elif avg_risk > 50:
            print("WARNING: NETWORK SECURITY STATUS: ELEVATED RISK")
        else:
            print("OK: NETWORK SECURITY STATUS: NOMINAL")
        
        print("\nHidden Services Identified:")
        for service in self.found_services:
            print(f"  [H] {service} (Risk: {self.node_metadata[service]['risk_score']})")
        
        print("\nEntry Points:")
        for node in self.visited_nodes:
            if self._classify_node(node) == 'EntryNode':
                print(f"  [E] {node}")
    
    def start_crawl(self, start_node: str = 'ENTRY_GATEWAY'):
        print("INITIATING DARK WEB CRAWLER")
        print("Starting TOR circuit establishment...")
        time.sleep(0.3)
        
        print("\n" + "="*60)
        print("CRAWLING PROGRESS")
        print("="*60)
        
        self._crawl_dfs(start_node, 0, [])
        
        self.generate_network_map()
        self.display_statistics()
        
        print("\n" + "="*60)
        print("CRAWL COMPLETE")
        print("="*60)
        print("WARNING: This is a for research purposes only.")
        print("NOTICE: All data is randomly generated and anonymized.")

def main():
    crawler = DarkWebCrawler()
    crawler.start_crawl()

if __name__ == "__main__":
    main()
