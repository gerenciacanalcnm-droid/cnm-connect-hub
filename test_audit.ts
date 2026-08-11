import { processAutomationTrigger } from './src/lib/automation-engine.server';
import { supabaseAdmin } from './src/integrations/supabase/client.server';

const COMPANY_ID = "00000000-0000-4000-8000-000000000001";

async function run() {
    console.log("--- Validando Wallet y Motor Comercial ---");
    // 1. Intentar trackServiceUsage (que llama a applyWalletMovement)
    // Usamos el ID de una wallet real si existe o el company_id
    const { data: wallets } = await supabaseAdmin.from('wallets' as any).select('*').eq('company_id', COMPANY_ID).eq('channel', 'sms');
    
    if (wallets && wallets.length > 0) {
        console.log("✓ Wallet SMS encontrada. Saldo:", wallets[0].balance);
        
        // Simular un cobro por automatización
        const ref = "audit_wallet_" + Date.now();
        console.log("Probando idempotencia en wallet...");
        
        const { applyWalletMovement } = await import('./src/lib/commercial.functions');
        
        // Primera ejecución
        const res1 = await applyWalletMovement(supabaseAdmin as any, {
            walletId: wallets[0].id,
            amount: -10, // 10 COP
            units: -1,
            type: "AJUSTE_DEBITO",
            concept: "Audit Wallet Test",
            reference: ref,
            performedBy: "00000000-0000-0000-0000-000000000000"
        });
        console.log("Res 1 - Saldo después:", res1.balanceAfter);

        // Segunda ejecución (idempotencia)
        const res2 = await applyWalletMovement(supabaseAdmin as any, {
            walletId: wallets[0].id,
            amount: -10,
            units: -1,
            type: "AJUSTE_DEBITO",
            concept: "Audit Wallet Test",
            reference: ref,
            performedBy: "00000000-0000-0000-0000-000000000000"
        });
        console.log("Res 2 (idempotente) - Saldo después:", res2.balanceAfter);
        
        if (res1.balanceAfter === res2.balanceAfter) {
            console.log("✓ Idempotencia en Wallet VALIDADA");
        } else {
            console.error("✗ FALLO de idempotencia en Wallet");
        }
    } else {
        console.log("⚠️ No se encontró wallet SMS para probar.");
    }
}
run();
