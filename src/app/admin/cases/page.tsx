'use client'

import React, { useEffect, useState } from 'react'
import { useAuth } from '@/lib/auth-context'
import { casesAPI } from '@/lib/api'
import { ICaseTemplate } from '@/types'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import { DifficultyBadge } from '@/components/ui/Badge'
import { InlineLoader } from '@/components/ui/LoadingSpinner'
import { useToast } from '@/components/ui/Toast'
import SearchAndFilter from '@/components/features/SearchAndFilter'
import { format } from 'date-fns'

export default function AdminCasesPage() {
  const { user } = useAuth()
  const { addToast } = useToast()
  const [cases, setCases] = useState<ICaseTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCase, setEditingCase] = useState<ICaseTemplate | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    industry: '',
    difficulty: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    estimatedDuration: 30,
    systemPrompt: '',
    initialMessage: '',
    tags: [] as string[],
    isActive: true
  })

  const industries = ['Technology', 'Healthcare', 'Finance', 'Retail', 'Manufacturing', 'Consulting']
  const difficulties = ['beginner', 'intermediate', 'advanced']

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchCases()
    }
  }, [user])

  const fetchCases = async () => {
    try {
      const response = await casesAPI.getCases({ limit: 100 })
      setCases(response.cases)
    } catch (error) {
      console.error('Failed to fetch cases:', error)
      addToast({
        type: 'error',
        title: 'Failed to load cases',
        message: 'Please try again later'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (caseTemplate?: ICaseTemplate) => {
    if (caseTemplate) {
      setEditingCase(caseTemplate)
      setFormData({
        title: caseTemplate.title,
        description: caseTemplate.description,
        industry: caseTemplate.industry,
        difficulty: caseTemplate.difficulty,
        estimatedDuration: caseTemplate.estimatedDuration,
        systemPrompt: caseTemplate.systemPrompt,
        initialMessage: caseTemplate.initialMessage,
        tags: caseTemplate.tags,
        isActive: caseTemplate.isActive
      })
    } else {
      setEditingCase(null)
      setFormData({
        title: '',
        description: '',
        industry: '',
        difficulty: 'beginner',
        estimatedDuration: 30,
        systemPrompt: '',
        initialMessage: '',
        tags: [],
        isActive: true
      })
    }
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setEditingCase(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingCase) {
        await casesAPI.updateCase(editingCase._id, formData)
        addToast({
          type: 'success',
          title: 'Case updated successfully'
        })
      } else {
        await casesAPI.createCase(formData)
        addToast({
          type: 'success',
          title: 'Case created successfully'
        })
      }
      
      handleCloseModal()
      fetchCases()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to save case',
        message: error.response?.data?.error || 'Please try again'
      })
    }
  }

  const handleDelete = async (caseId: string) => {
    if (!confirm('Are you sure you want to delete this case?')) return
    
    try {
      await casesAPI.deleteCase(caseId)
      addToast({
        type: 'success',
        title: 'Case deleted successfully'
      })
      fetchCases()
    } catch (error: any) {
      addToast({
        type: 'error',
        title: 'Failed to delete case',
        message: error.response?.data?.error || 'Please try again'
      })
    }
  }

  const filteredCases = cases.filter(caseTemplate => {
    const matchesSearch = caseTemplate.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         caseTemplate.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesIndustry = !selectedIndustry || caseTemplate.industry === selectedIndustry
    const matchesDifficulty = !selectedDifficulty || caseTemplate.difficulty === selectedDifficulty
    
    return matchesSearch && matchesIndustry && matchesDifficulty
  })

  if (user?.role !== 'admin') {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Card>
          <div className="text-center py-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600">You need admin privileges to access this page.</p>
          </div>
        </Card>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <InlineLoader message="Loading cases..." />
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manage Cases</h1>
          <p className="mt-2 text-gray-600">Create and manage case interview templates</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          Create New Case
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="mb-8">
        <SearchAndFilter
          searchPlaceholder="Search cases..."
          searchValue={searchTerm}
          onSearchChange={setSearchTerm}
          filters={[
            {
              label: 'Industry',
              key: 'industry',
              options: industries.map(industry => ({ value: industry, label: industry })),
              value: selectedIndustry,
              onChange: setSelectedIndustry
            },
            {
              label: 'Difficulty',
              key: 'difficulty',
              options: difficulties.map(difficulty => ({ 
                value: difficulty, 
                label: difficulty.charAt(0).toUpperCase() + difficulty.slice(1) 
              })),
              value: selectedDifficulty,
              onChange: setSelectedDifficulty
            }
          ]}
          onClearFilters={() => {
            setSearchTerm('')
            setSelectedIndustry('')
            setSelectedDifficulty('')
          }}
        />
      </div>

      {/* Cases Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Case
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Industry
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Duration
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCases.map((caseTemplate) => (
                <tr key={caseTemplate._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{caseTemplate.title}</div>
                      <div className="text-sm text-gray-500 truncate max-w-xs">
                        {caseTemplate.description}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {caseTemplate.industry}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <DifficultyBadge difficulty={caseTemplate.difficulty} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {caseTemplate.estimatedDuration} min
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      caseTemplate.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {caseTemplate.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(caseTemplate.createdAt), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenModal(caseTemplate)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(caseTemplate._id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCase ? 'Edit Case' : 'Create New Case'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Title"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              rows={3}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Industry
              </label>
              <select
                value={formData.industry}
                onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                <option value="">Select Industry</option>
                {industries.map(industry => (
                  <option key={industry} value={industry}>{industry}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Difficulty
              </label>
              <select
                value={formData.difficulty}
                onChange={(e) => setFormData({ ...formData, difficulty: e.target.value as any })}
                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                required
              >
                {difficulties.map(difficulty => (
                  <option key={difficulty} value={difficulty}>
                    {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <Input
            label="Estimated Duration (minutes)"
            type="number"
            value={formData.estimatedDuration}
            onChange={(e) => setFormData({ ...formData, estimatedDuration: parseInt(e.target.value) })}
            min={5}
            max={180}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              System Prompt
            </label>
            <textarea
              value={formData.systemPrompt}
              onChange={(e) => setFormData({ ...formData, systemPrompt: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              rows={4}
              placeholder="Instructions for the AI coach..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Initial Message
            </label>
            <textarea
              value={formData.initialMessage}
              onChange={(e) => setFormData({ ...formData, initialMessage: e.target.value })}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
              rows={3}
              placeholder="The first message users will see..."
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
              Active (visible to users)
            </label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit">
              {editingCase ? 'Update Case' : 'Create Case'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
