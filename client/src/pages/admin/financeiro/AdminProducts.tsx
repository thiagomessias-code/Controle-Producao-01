import React, { useEffect, useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import Button from '@/components/ui/Button';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";
import { Package, Plus, Trash2, Edit, Info } from 'lucide-react';
import { Switch } from "@/components/ui/switch";

interface ProductVariation {
    id: string;
    product_id: string;
    name: string;
    price: number;
    unit_type: string;
    active: boolean;
}

interface Product {
    id: string;
    nome: string;
    tipo: string;
    ativo: boolean;
    validity_days?: number;
    controla_estoque?: boolean;
    ficha_tecnica?: any[];
    product_variations?: ProductVariation[];
}

export const AdminProducts: React.FC = () => {
    const [produtos, setProdutos] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Product>>({ ativo: true, tipo: 'ovo', validity_days: 30, controla_estoque: true, ficha_tecnica: [] });
    const [editingId, setEditingId] = useState<string | null>(null);

    // Variations State for the current product being edited
    const [variations, setVariations] = useState<Partial<ProductVariation>[]>([]);

    useEffect(() => {
        fetchProdutos();
    }, []);

    const fetchProdutos = async () => {
        try {
            const { data, error } = await supabase
                .from('produtos')
                .select('*, product_variations(*)')
                .order('nome');

            if (error) throw error;
            setProdutos(data || []);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            let productId = editingId;
            let productData = {
                nome: formData.nome,
                tipo: formData.tipo,
                ativo: formData.ativo,
                validity_days: formData.validity_days,
                controla_estoque: formData.controla_estoque,
                ficha_tecnica: formData.ficha_tecnica
            };

            if (productId) {
                const { error } = await supabase
                    .from('produtos')
                    .update(productData)
                    .eq('id', productId);
                if (error) throw error;
            } else {
                const { data, error } = await supabase
                    .from('produtos')
                    .insert(productData)
                    .select()
                    .single();
                if (error) throw error;
                productId = data.id;
            }

            // Save Variations
            for (const v of variations) {
                const variationData = {
                    product_id: productId,
                    name: v.name,
                    price: v.price,
                    unit_type: v.unit_type,
                    active: v.active !== false
                };

                if (v.id && !v.id.startsWith('temp-')) {
                    const { error } = await supabase.from('product_variations').update(variationData).eq('id', v.id);
                    if (error) throw error;
                } else {
                    const { error } = await supabase.from('product_variations').insert(variationData);
                    if (error) throw error;
                }
            }

            // Handle deletions if needed? 
            // For simplicity, we currently only Add/Edit in this view. 
            // Deletion of variations needs explicit handler.

            fetchProdutos();
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            console.error('Erro ao salvar:', error);
            alert('Erro ao salvar produto.');
        }
    };

    const handleDeleteProduct = async (id: string) => {
        if (!confirm('Deseja excluir este produto e suas variações?')) return;
        try {
            await supabase.from('produtos').delete().eq('id', id);
            fetchProdutos();
        } catch (error) {
            console.error('Erro ao deletar:', error);
        }
    };

    const startEdit = (produto: Product) => {
        setFormData({
            nome: produto.nome,
            tipo: produto.tipo,
            ativo: produto.ativo,
            validity_days: produto.validity_days,
            controla_estoque: produto.controla_estoque ?? true,
            ficha_tecnica: produto.ficha_tecnica || []
        });
        setVariations(produto.product_variations || []);
        setEditingId(produto.id);
        setIsDialogOpen(true);
    };

    const startNew = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const resetForm = () => {
        setFormData({ ativo: true, tipo: 'ovo', validity_days: 30, controla_estoque: true, ficha_tecnica: [] });
        setVariations([]);
        setEditingId(null);
    };

    // Variation Handlers
    const addVariation = () => {
        setVariations([...variations, {
            id: `temp-${Date.now()}`,
            name: '',
            price: 0,
            unit_type: 'unidade',
            active: true
        }]);
    };

    const updateVariation = (index: number, field: keyof ProductVariation, value: any) => {
        const newVars = [...variations];
        newVars[index] = { ...newVars[index], [field]: value };
        setVariations(newVars);
    };

    const removeVariation = async (index: number, v: Partial<ProductVariation>) => {
        if (v.id && !v.id.startsWith('temp-')) {
            if (!confirm('Excluir esta variação do banco de dados?')) return;
            await supabase.from('product_variations').delete().eq('id', v.id);
        }
        const newVars = variations.filter((_, i) => i !== index);
        setVariations(newVars);
    };

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Gerenciar Produtos</h1>
                    <p className="text-gray-500 mt-1">Configure os produtos e preços de venda da sua granja.</p>
                </div>
                <Button onClick={startNew} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all">
                    <Plus className="w-4 h-4 mr-2" /> Novo Produto
                </Button>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
            }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editingId ? 'Editar Produto' : 'Novo Produto'}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSaveProduct} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Nome do Produto</Label>
                                <Input
                                    value={formData.nome || ''}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    required
                                    placeholder="Ex: Ovos"
                                />
                            </div>
                            <div>
                                <Label>Tipo</Label>
                                <select
                                    className="w-full border rounded-lg p-2 text-sm bg-background focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                    value={formData.tipo || ''}
                                    onChange={e => setFormData({ ...formData, tipo: e.target.value })}
                                    required
                                >
                                    <option value="ovo">Ovo</option>
                                    <option value="ave_viva">Ave Viva</option>
                                    <option value="esterco">Esterco/Adubo</option>
                                    <option value="outro">Outro</option>
                                </select>
                            </div>

                            <div className="col-span-2 md:col-span-1">
                                <Label>Validade Padrão (Dias)</Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={formData.validity_days || ''}
                                    onChange={e => setFormData({ ...formData, validity_days: parseInt(e.target.value) })}
                                    placeholder="Ex: 30"
                                />
                                <p className="text-xs text-gray-500 mt-1">Usado para cálculo de FIFO no estoque.</p>
                            </div>

                            <div className="col-span-2 py-5 border-y bg-gray-50/30 px-4 -mx-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className="mt-1 p-2 bg-blue-100 text-blue-700 rounded-lg">
                                            <Info size={18} />
                                        </div>
                                        <div>
                                            <Label className="text-base font-bold text-gray-900 leading-tight">Controla Estoque Físico?</Label>
                                            <p className="text-sm text-gray-500 mt-0.5">
                                                {formData.controla_estoque
                                                    ? "Sim, este item existe fisicamente no armazém."
                                                    : "Não, este é um produto derivado que consome outros itens."}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-xl shadow-sm border border-gray-100">
                                        <span className={`text-xs font-black uppercase tracking-widest ${formData.controla_estoque ? 'text-blue-600' : 'text-orange-600'}`}>
                                            {formData.controla_estoque ? 'Estocável' : 'Derivado'}
                                        </span>
                                        <Switch
                                            checked={formData.controla_estoque}
                                            onCheckedChange={checked => setFormData({ ...formData, controla_estoque: checked })}
                                        />
                                    </div>
                                </div>
                            </div>

                            {!formData.controla_estoque && (
                                <div className="col-span-2 space-y-4 bg-orange-50/50 p-4 rounded-xl border border-orange-100">
                                    <div className="flex justify-between items-center">
                                        <h3 className="font-bold text-orange-800">Ficha Técnica (Insumos)</h3>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setFormData({
                                                ...formData,
                                                ficha_tecnica: [...(formData.ficha_tecnica || []), { raw_material_name: 'Ovo Cru', stock_type: 'egg', quantity: 30 }]
                                            })}
                                            className="bg-white border-orange-200 text-orange-700 hover:bg-orange-100"
                                        >
                                            <Plus size={14} className="mr-1" /> Adicionar Insumo
                                        </Button>
                                    </div>

                                    <div className="space-y-2">
                                        {(formData.ficha_tecnica || []).map((item, idx) => (
                                            <div key={idx} className="flex gap-2 items-end">
                                                <div className="flex-1">
                                                    <Label className="text-[10px] uppercase font-bold text-orange-600">Insumo</Label>
                                                    <Input
                                                        value={item.raw_material_name}
                                                        onChange={e => {
                                                            const newFicha = [...(formData.ficha_tecnica || [])];
                                                            newFicha[idx].raw_material_name = e.target.value;
                                                            setFormData({ ...formData, ficha_tecnica: newFicha });
                                                        }}
                                                        placeholder="Ex: Ovo Cru"
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <div className="w-24">
                                                    <Label className="text-[10px] uppercase font-bold text-orange-600">Tipo</Label>
                                                    <select
                                                        className="w-full h-8 border rounded px-2 text-sm bg-white"
                                                        value={item.stock_type}
                                                        onChange={e => {
                                                            const newFicha = [...(formData.ficha_tecnica || [])];
                                                            newFicha[idx].stock_type = e.target.value;
                                                            setFormData({ ...formData, ficha_tecnica: newFicha });
                                                        }}
                                                    >
                                                        <option value="egg">Ovo</option>
                                                        <option value="meat">Carne</option>
                                                        <option value="chick">Pinto</option>
                                                    </select>
                                                </div>
                                                <div className="w-20">
                                                    <Label className="text-[10px] uppercase font-bold text-orange-600">Qtd</Label>
                                                    <Input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={e => {
                                                            const newFicha = [...(formData.ficha_tecnica || [])];
                                                            newFicha[idx].quantity = Number(e.target.value);
                                                            setFormData({ ...formData, ficha_tecnica: newFicha });
                                                        }}
                                                        className="h-8 text-sm"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 w-8 p-0 text-orange-300 hover:text-red-500"
                                                    onClick={() => {
                                                        const newFicha = (formData.ficha_tecnica || []).filter((_, i) => i !== idx);
                                                        setFormData({ ...formData, ficha_tecnica: newFicha });
                                                    }}
                                                >
                                                    <Trash2 size={14} />
                                                </Button>
                                            </div>
                                        ))}
                                        {(formData.ficha_tecnica || []).length === 0 && (
                                            <p className="text-center py-2 text-xs text-orange-400 italic">Defina quais insumos este produto consome.</p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="border-t pt-4">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-semibold text-lg text-gray-800">Variações de Venda</h3>
                                <Button type="button" size="sm" variant="outline" onClick={addVariation} className="border-dashed border-2 hover:border-blue-500 hover:text-blue-600">
                                    <Plus size={16} className="mr-1" /> Adicionar Variação
                                </Button>
                            </div>

                            <div className="space-y-3">
                                {variations.map((v, idx) => (
                                    <div key={v.id || idx} className="flex gap-3 items-end bg-gray-50/80 p-4 rounded-xl border border-gray-100 transition-all hover:border-blue-200 hover:bg-white hover:shadow-sm group">
                                        <div className="flex-1">
                                            <Label className="text-xs text-gray-500 font-medium">Nome da Variação</Label>
                                            <Input
                                                value={v.name}
                                                onChange={e => updateVariation(idx, 'name', e.target.value)}
                                                placeholder="Ex: Bandeja 30"
                                                required
                                                className="mt-1"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <Label className="text-xs text-gray-500 font-medium">Preço (R$)</Label>
                                            <Input
                                                type="number"
                                                step="0.01"
                                                value={v.price}
                                                onChange={e => updateVariation(idx, 'price', Number(e.target.value))}
                                                required
                                                className="mt-1 font-mono"
                                            />
                                        </div>
                                        <div className="w-32">
                                            <Label className="text-xs text-gray-500 font-medium">Unidade</Label>
                                            <select
                                                className="w-full border rounded-lg p-2 text-sm bg-white h-10 mt-1 focus:ring-2 focus:ring-blue-500 outline-none"
                                                value={v.unit_type}
                                                onChange={e => updateVariation(idx, 'unit_type', e.target.value)}
                                            >
                                                <option value="unidade">Unidade</option>
                                                <option value="dúzia">Dúzia</option>
                                                <option value="bandeja">Bandeja</option>
                                                <option value="kg">Kg</option>
                                                <option value="caixa">Caixa</option>
                                            </select>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            className="h-9 w-9 p-0 text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                                            onClick={() => removeVariation(idx, v)}
                                        >
                                            <Trash2 size={18} />
                                        </Button>
                                    </div>
                                ))}
                                {variations.length === 0 && (
                                    <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                        <p className="text-sm text-gray-500">Nenhuma variação cadastrada.</p>
                                        <p className="text-xs text-gray-400 mt-1">Adicione preços e unidades de venda.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white">Salvar Produto</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-12 text-center text-gray-500">Carregando produtos...</div>
                ) : produtos.map((prod) => (
                    <Card key={prod.id} className="group overflow-hidden border-none shadow-sm hover:shadow-lg transition-all duration-300">
                        <div className={`h-1.5 w-full ${prod.ativo ? 'bg-blue-500' : 'bg-gray-300'}`}></div>
                        <CardHeader className="flex flex-row items-start justify-between pb-2 pt-5">
                            <div>
                                <div className="font-bold flex items-center gap-2 text-lg text-gray-900">
                                    <Package size={20} className={prod.ativo ? "text-blue-600" : "text-gray-400"} />
                                    {prod.nome}
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full mt-1 inline-block ${prod.ativo
                                    ? 'bg-blue-50 text-blue-700 border border-blue-100'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200'
                                    }`}>
                                    {prod.tipo?.replace('_', ' ')}
                                </span>
                            </div>
                            <Button variant="outline" size="sm" onClick={() => startEdit(prod)} className="h-9 w-9 p-0 text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100 transition-all shadow-sm" title="Editar Produto">
                                <Edit size={18} />
                            </Button>
                        </CardHeader>
                        <CardContent className="pb-6">
                            <div className="mt-4 space-y-2">
                                <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Tabela de Preços</div>
                                {prod.product_variations && prod.product_variations.length > 0 ? (
                                    <div className="bg-gray-50/50 rounded-lg p-1">
                                        {prod.product_variations.map(v => (
                                            <div key={v.id} className="flex justify-between items-center text-sm p-2 hover:bg-white hover:shadow-sm rounded transition-all">
                                                <span className="text-gray-700">{v.name}</span>
                                                <span className="font-mono font-bold text-gray-900">R$ {Number(v.price).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-yellow-50 text-yellow-700 text-sm rounded-lg border border-yellow-100 flex items-center gap-2">
                                        <span className="text-xl">⚠️</span>
                                        Sem variações cadastradas
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};
