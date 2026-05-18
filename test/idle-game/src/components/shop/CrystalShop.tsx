import React, { useState } from 'react';
import { useGame } from '../../contexts/GameEngineContext';
import { CRYSTAL_SHOP_ITEMS, type CrystalShopItem, type SeedInstance } from '../../game';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Gem, Sparkles, FlaskRound, Clock, Package } from 'lucide-react';
import { getTierStyles } from '@/utils/assets';
import SeedIcon from '@/components/ui/SeedIcon';

const CrystalShop: React.FC = () => {
  const { state, purchaseCrystalShopItem, seedTiers } = useGame();
  const [purchaseResult, setPurchaseResult] = useState<{
    success: boolean;
    message?: string;
    items?: SeedInstance[];
  } | null>(null);
  const [showDialog, setShowDialog] = useState(false);

  const handlePurchase = async (itemId: string) => {
    const result = await purchaseCrystalShopItem(itemId);
    setPurchaseResult({
      success: result.success,
      message: result.error || (result.success ? 'Purchase successful!' : 'Purchase failed'),
    });
    setShowDialog(true);
  };

  const getItemIcon = (item: CrystalShopItem) => {
    switch (item.type) {
      case 'gacha':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      case 'essence':
        return <FlaskRound className="w-5 h-5 text-green-400" />;
      case 'timeSkip':
        return <Clock className="w-5 h-5 text-blue-400" />;
      default:
        return <Package className="w-5 h-5" />;
    }
  };

  const shopItems = Object.values(CRYSTAL_SHOP_ITEMS);
  const gachaItems = shopItems.filter(i => i.type === 'gacha');
  const essenceItems = shopItems.filter(i => i.type === 'essence');
  const timeItems = shopItems.filter(i => i.type === 'timeSkip');
  const affordableCount = shopItems.filter(i => state.ship.crystals >= i.cost).length;

  const renderShopItem = (item: CrystalShopItem) => {
    const canAfford = state.ship.crystals >= item.cost;

    return (
      <Card
        key={item.id}
        className={`bg-secondary/50 border-border/50 transition-all ${canAfford ? 'hover:border-purple-500/50' : 'opacity-60'}`}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-background/50">{getItemIcon(item)}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm">{item.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between mt-3">
            <Badge variant="secondary" className="gap-1 text-purple-400">
              <Gem className="w-3 h-3" />
              {item.cost}
            </Badge>
            <Button
              onClick={() => handlePurchase(item.id)}
              disabled={!canAfford}
              variant="default"
              size="sm"
              className="text-xs"
            >
              Purchase
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-500/30">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-purple-300">
              <Gem className="w-5 h-5" />
              Crystal Shop
            </CardTitle>
            <Badge variant="secondary" className="gap-1 text-lg px-3 py-1 text-purple-300">
              <Gem className="w-4 h-4" />
              {state.ship.crystals.toLocaleString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pb-4">
          <p className="text-sm text-muted-foreground">
            Spend crystals on premium items. Earn crystals from achievements and quests.
            {affordableCount > 0 && (
              <span className="text-green-400 ml-1">({affordableCount} affordable)</span>
            )}
          </p>
        </CardContent>
      </Card>

      {/* Premium Seeds */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          Premium Seeds
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {gachaItems.map(renderShopItem)}
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Premium pulls guarantee Uncommon or better. Rates: 80% Uncommon, 15% Rare, 4% Epic, 1%
          Legendary
        </p>
      </div>

      {/* Essence Packs */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <FlaskRound className="w-4 h-4 text-green-400" />
          Essence Packs
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {essenceItems.map(renderShopItem)}
        </div>
      </div>

      {/* Time Warps */}
      <div>
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-400" />
          Time Warps
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">{timeItems.map(renderShopItem)}</div>
      </div>

      {/* Purchase Result Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {purchaseResult?.success ? 'Purchase Complete!' : 'Purchase Failed'}
            </DialogTitle>
            <DialogDescription>{purchaseResult?.message}</DialogDescription>
          </DialogHeader>

          {purchaseResult?.items && purchaseResult.items.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-sm font-medium">You received:</p>
              <div className="grid grid-cols-2 gap-2">
                {purchaseResult.items.map((seed, i) => {
                  const tierData = seedTiers[seed.tier as keyof typeof seedTiers];
                  const tierStyles = getTierStyles(seed.tier);
                  return (
                    <Card
                      key={i}
                      className="bg-secondary/50"
                      style={{ borderColor: tierStyles.borderColor, borderWidth: '1px' }}
                    >
                      <CardContent className="p-2 flex items-center gap-2">
                        <SeedIcon seed={seed} size={32} />
                        <div className="min-w-0 flex-1">
                          <p className="capitalize font-medium text-xs truncate">{seed.name}</p>
                          <Badge
                            variant="secondary"
                            className="text-xs mt-0.5"
                            style={{ color: tierStyles.borderColor }}
                          >
                            {tierData?.name || `T${seed.tier}`}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrystalShop;
